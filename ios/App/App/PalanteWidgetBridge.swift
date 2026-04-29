import Foundation
import Capacitor
import WidgetKit

@objc(PalanteWidgetBridgePlugin)
public class PalanteWidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PalanteWidgetBridgePlugin"
    public let jsName = "PalanteWidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "updateWidgetData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reloadWidget", returnType: CAPPluginReturnPromise)
    ]

    private let appGroup = "group.com.move.palante.dev"

    @objc func updateWidgetData(_ call: CAPPluginCall) {
        print("🟢 PalanteWidgetBridge.updateWidgetData called")
        guard let defaults = UserDefaults(suiteName: appGroup) else {
            print("❌ PalanteWidgetBridge: App Group UserDefaults failed for \(appGroup)")
            call.reject("App Group not configured: \(appGroup)")
            return
        }
        print("✅ PalanteWidgetBridge: App Group UserDefaults acquired")

        if let streak = call.getInt("streak") {
            defaults.set(streak, forKey: "palante_streak")
        }
        if let name = call.getString("practiceName") {
            defaults.set(name, forKey: "palante_practice_name")
        }
        if let done = call.getBool("practiceComplete") {
            defaults.set(done, forKey: "palante_practice_complete")
        }

        // Capacitor deserializes JS objects as [String: Any], not [String: String]
        if let rawQuotes = call.getArray("quotes") as? [[String: Any]] {
            let quotes = rawQuotes.map { q -> [String: String] in
                ["text": q["text"] as? String ?? "", "author": q["author"] as? String ?? ""]
            }
            if let data = try? JSONSerialization.data(withJSONObject: quotes) {
                defaults.set(data, forKey: "palante_quotes")
            }
        }

        // Starting index so the widget timeline begins at the right hour slot
        if let startIndex = call.getInt("quoteStartIndex") {
            defaults.set(startIndex, forKey: "palante_quote_start_index")
        }

        // Goals list for the medium widget
        if let rawGoals = call.getArray("goals") as? [[String: Any]] {
            let goals = rawGoals.map { g -> [String: Any] in
                ["text": g["text"] as? String ?? "", "completed": g["completed"] as? Bool ?? false]
            }
            if let data = try? JSONSerialization.data(withJSONObject: goals) {
                defaults.set(data, forKey: "palante_goals")
            }
        }

        let streakWritten = defaults.integer(forKey: "palante_streak")
        print("✅ PalanteWidgetBridge: wrote streak=\(streakWritten), reloading widget timeline")
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadTimelines(ofKind: "PalanteWidget")
        }
        call.resolve()
    }

    @objc func reloadWidget(_ call: CAPPluginCall) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadTimelines(ofKind: "PalanteWidget")
        }
        call.resolve()
    }
}
