import Foundation
import Capacitor
import UIKit
#if canImport(DeclaredAgeRange)
import DeclaredAgeRange
#endif

/// Bridges Apple's Declared Age Range API (iOS 26+) to JS. This is an additional,
/// OS-verified/guardian-declared age signal layered on top of the existing
/// self-reported birth-year gate (see AgeVerificationModal) — it never replaces it.
/// On iOS < 26, the Simulator, or if the user declines, this resolves "unavailable"/
/// "declined" and callers fall back to the self-report flow unchanged.
@objc(PalanteAgeRangeBridgePlugin)
public class PalanteAgeRangeBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PalanteAgeRangeBridgePlugin"
    public let jsName = "PalanteAgeRangeBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestAgeRange", returnType: CAPPluginReturnPromise),
    ]

    @objc func requestAgeRange(_ call: CAPPluginCall) {
        #if canImport(DeclaredAgeRange)
        guard #available(iOS 26.0, *) else {
            call.resolve(["outcome": "unavailable"])
            return
        }
        guard let viewController = self.bridge?.viewController else {
            call.resolve(["outcome": "unavailable"])
            return
        }
        // Single threshold at 13: COPPA is the only bucket boundary Palante's age
        // gate cares about today.
        Task {
            do {
                let response = try await AgeRangeService.shared.requestAgeRange(ageGates: 13, in: viewController)
                switch response {
                case .declinedSharing:
                    call.resolve(["outcome": "declined"])
                case .sharing(let range):
                    var result: [String: Any] = ["outcome": "shared"]
                    if let lower = range.lowerBound { result["lowerBound"] = lower }
                    if let upper = range.upperBound { result["upperBound"] = upper }
                    call.resolve(result)
                }
            } catch {
                // notAvailable / invalidRequest / anything else — caller falls back to self-report
                call.resolve(["outcome": "unavailable"])
            }
        }
        #else
        call.resolve(["outcome": "unavailable"])
        #endif
    }
}
