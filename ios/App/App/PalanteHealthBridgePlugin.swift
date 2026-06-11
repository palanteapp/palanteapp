import Foundation
import Capacitor
import HealthKit

@objc(PalanteHealthBridgePlugin)
public class PalanteHealthBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PalanteHealthBridgePlugin"
    public let jsName = "PalanteHealthBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "checkAuthStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getHealthContext", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "logMindfulSession", returnType: CAPPluginReturnPromise),
    ]

    private let store = HKHealthStore()

    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        if let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) { types.insert(sleep) }
        if let hr = HKObjectType.quantityType(forIdentifier: .heartRate) { types.insert(hr) }
        return types
    }

    private var writeTypes: Set<HKSampleType> {
        var types = Set<HKSampleType>()
        if let mindful = HKObjectType.categoryType(forIdentifier: .mindfulSession) { types.insert(mindful) }
        return types
    }

    @objc func checkAuthStatus(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["status": "unavailable"])
            return
        }
        // We check sleep as the representative read type
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            call.resolve(["status": "unavailable"])
            return
        }
        let status = store.authorizationStatus(for: sleepType)
        switch status {
        case .sharingAuthorized:
            call.resolve(["status": "authorized"])
        case .sharingDenied:
            call.resolve(["status": "denied"])
        default:
            call.resolve(["status": "notDetermined"])
        }
    }

    @objc func requestPermissions(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["status": "unavailable"])
            return
        }
        store.requestAuthorization(toShare: writeTypes, read: readTypes) { success, error in
            if let error = error {
                call.reject("HealthKit auth failed: \(error.localizedDescription)")
                return
            }
            call.resolve(["status": success ? "authorized" : "denied"])
        }
    }

    @objc func getHealthContext(_ call: CAPPluginCall) {
        let group = DispatchGroup()
        var sleepHours: Double? = nil
        var restingHR: Double? = nil
        var sleepTrend: String? = nil

        // --- Sleep last night ---
        group.enter()
        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            let now = Date()
            let yesterday = Calendar.current.date(byAdding: .hour, value: -20, to: now)!
            let predicate = HKQuery.predicateForSamples(withStart: yesterday, end: now)
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: 50, sortDescriptors: [sort]) { _, samples, _ in
                defer { group.leave() }
                guard let samples = samples as? [HKCategorySample] else { return }
                // Sum asleep stages (value 0 = InBed is excluded; 1 = Asleep, 3 = Core, 4 = Deep, 5 = REM)
                let asleepValues: Set<Int> = [1, 3, 4, 5]
                let totalSeconds = samples
                    .filter { asleepValues.contains($0.value) }
                    .reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) }
                if totalSeconds > 0 {
                    sleepHours = totalSeconds / 3600.0
                }
            }
            store.execute(query)
        } else {
            group.leave()
        }

        // --- Resting heart rate (last 7 days avg) ---
        group.enter()
        if let hrType = HKQuantityType.quantityType(forIdentifier: .heartRate) {
            let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
            let predicate = HKQuery.predicateForSamples(withStart: sevenDaysAgo, end: Date())
            let query = HKStatisticsQuery(
                quantityType: hrType,
                quantitySamplePredicate: predicate,
                options: .discreteAverage
            ) { _, stats, _ in
                defer { group.leave() }
                if let avg = stats?.averageQuantity() {
                    restingHR = avg.doubleValue(for: HKUnit(from: "count/min"))
                }
            }
            store.execute(query)
        } else {
            group.leave()
        }

        // --- Sleep trend (last 7 nights avg vs last night) ---
        group.enter()
        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
            let yesterday = Calendar.current.date(byAdding: .hour, value: -20, to: Date())!
            let predicate = HKQuery.predicateForSamples(withStart: sevenDaysAgo, end: yesterday)
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: 200, sortDescriptors: [sort]) { _, samples, _ in
                defer { group.leave() }
                guard let samples = samples as? [HKCategorySample] else { return }
                let asleepValues: Set<Int> = [1, 3, 4, 5]
                // Group by calendar day and sum each day
                var dailyTotals: [String: Double] = [:]
                let fmt = DateFormatter()
                fmt.dateFormat = "yyyy-MM-dd"
                for s in samples where asleepValues.contains(s.value) {
                    let day = fmt.string(from: s.startDate)
                    dailyTotals[day, default: 0] += s.endDate.timeIntervalSince(s.startDate)
                }
                guard !dailyTotals.isEmpty else { return }
                let avgSeconds = dailyTotals.values.reduce(0, +) / Double(dailyTotals.count)
                let avgHours = avgSeconds / 3600.0
                if let lastNight = sleepHours {
                    let diff = lastNight - avgHours
                    if diff < -1.0 { sleepTrend = "below_average" }
                    else if diff > 1.0 { sleepTrend = "above_average" }
                    else { sleepTrend = "typical" }
                }
            }
            store.execute(query)
        } else {
            group.leave()
        }

        group.notify(queue: .main) {
            var result: [String: Any] = [:]
            if let s = sleepHours { result["sleepHours"] = round(s * 10) / 10 }
            if let hr = restingHR { result["restingHR"] = round(hr) }
            if let trend = sleepTrend { result["sleepTrend"] = trend }
            call.resolve(result)
        }
    }

    @objc func logMindfulSession(_ call: CAPPluginCall) {
        guard let mindfulType = HKObjectType.categoryType(forIdentifier: .mindfulSession) else {
            call.reject("Mindful session type unavailable")
            return
        }
        let startMs = call.getDouble("startTime") ?? (Date().timeIntervalSince1970 - 600) * 1000
        let endMs = call.getDouble("endTime") ?? Date().timeIntervalSince1970 * 1000
        let start = Date(timeIntervalSince1970: startMs / 1000)
        let end = Date(timeIntervalSince1970: endMs / 1000)

        let sample = HKCategorySample(type: mindfulType, value: HKCategoryValue.notApplicable.rawValue, start: start, end: end)
        store.save(sample) { success, error in
            if let error = error {
                call.reject("Failed to save mindful session: \(error.localizedDescription)")
            } else {
                call.resolve(["success": success])
            }
        }
    }
}
