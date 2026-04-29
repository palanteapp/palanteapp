import UIKit
import Capacitor
import AVFoundation
import WidgetKit

// Register custom plugins
@objc class AppPlugins: NSObject {
    @objc static func registerPlugins() {
        // PalanteAudioBridgePlugin and PalanteWidgetBridgePlugin are auto-discovered
        // via CAPBridgedPlugin — no manual registration needed in Capacitor 5+
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configure audio session for background playback (soundscapes continue when screen locks)
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            print("⚠️ AVAudioSession configuration failed: \(error)")
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {}

    func applicationDidEnterBackground(_ application: UIApplication) {}

    func applicationWillEnterForeground(_ application: UIApplication) {}

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Two-pass sync: 1.5 s covers foreground resume, 4 s covers cold-start WebView init
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { self.syncWidgetData() }
        DispatchQueue.main.asyncAfter(deadline: .now() + 4.0) { self.syncWidgetData() }
    }

    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // MARK: - Widget data sync (independent of Capacitor plugin)

    /// Finds the WKWebView by scanning the entire view hierarchy.
    private func findWKWebView(in view: UIView) -> WKWebView? {
        if let wv = view as? WKWebView { return wv }
        for sub in view.subviews {
            if let found = findWKWebView(in: sub) { return found }
        }
        return nil
    }

    private func syncWidgetData() {
        guard let rootVC = window?.rootViewController,
              let webView = findWKWebView(in: rootVC.view) else {
            print("⚠️ PalanteWidget sync: WKWebView not found yet")
            return
        }

        // Read the JS-side cache written by widgetDataSync.ts
        let js = "localStorage.getItem('palante_widget_cache')"
        webView.evaluateJavaScript(js) { [weak self] result, error in
            guard let jsonStr = result as? String,
                  !jsonStr.isEmpty,
                  let data = jsonStr.data(using: .utf8),
                  let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                if let err = error {
                    print("⚠️ PalanteWidget sync JS error: \(err)")
                } else {
                    print("⚠️ PalanteWidget sync: palante_widget_cache empty or missing")
                }
                return
            }
            self?.writeToWidgetDefaults(obj)
        }
    }

    private func writeToWidgetDefaults(_ obj: [String: Any]) {
        let appGroup = "group.com.move.palante.dev"
        guard let defaults = UserDefaults(suiteName: appGroup) else {
            print("❌ PalanteWidget sync: UserDefaults(suiteName:) returned nil — check App Group entitlement in provisioning profile")
            return
        }

        if let streak = obj["streak"] as? Int {
            defaults.set(streak, forKey: "palante_streak")
        }
        if let startIndex = obj["quoteStartIndex"] as? Int {
            defaults.set(startIndex, forKey: "palante_quote_start_index")
        }
        if let rawQuotes = obj["quotes"] as? [[String: Any]] {
            let mapped: [[String: String]] = rawQuotes.compactMap { q in
                guard let text = q["text"] as? String, !text.isEmpty else { return nil }
                return ["text": text, "author": q["author"] as? String ?? ""]
            }
            if !mapped.isEmpty, let qData = try? JSONSerialization.data(withJSONObject: mapped) {
                defaults.set(qData, forKey: "palante_quotes")
                print("✅ PalanteWidget sync: \(mapped.count) quotes written to App Group UserDefaults")
            }
        }
        if let rawGoals = obj["goals"] as? [[String: Any]] {
            let mapped: [[String: Any]] = rawGoals.map { g in
                ["text": g["text"] as? String ?? "", "completed": g["completed"] as? Bool ?? false]
            }
            if let gData = try? JSONSerialization.data(withJSONObject: mapped) {
                defaults.set(gData, forKey: "palante_goals")
            }
        }
        defaults.synchronize()

        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
            print("✅ PalanteWidget sync: reloadAllTimelines triggered")
        }
    }
}
