import UIKit
import WebKit
import WidgetKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // Window is created automatically from Main.storyboard — nothing to do here.
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        // Two-pass sync: 1.5 s covers foreground resume, 4 s covers cold-start WebView init.
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { self.syncWidgetData() }
        DispatchQueue.main.asyncAfter(deadline: .now() + 4.0) { self.syncWidgetData() }
    }

    func sceneWillResignActive(_ scene: UIScene) {}
    func sceneDidEnterBackground(_ scene: UIScene) {}
    func sceneWillEnterForeground(_ scene: UIScene) {}

    // MARK: - Widget data sync

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
            print("❌ PalanteWidget sync: UserDefaults(suiteName:) returned nil — check App Group entitlement")
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
