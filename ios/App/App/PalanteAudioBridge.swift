import Foundation
import Capacitor
import AVFoundation

/// Keeps the app's audio session alive when the user backgrounds the app.
/// Call `setPlaying(true)` from JS when soundscapes start, `setPlaying(false)` when they stop.
/// iOS will then allow the WKWebView audio to continue under the .playback session.
@objc(PalanteAudioBridgePlugin)
public class PalanteAudioBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PalanteAudioBridgePlugin"
    public let jsName = "PalanteAudioBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setPlaying", returnType: CAPPluginReturnPromise),
    ]

    private var bgTask: UIBackgroundTaskIdentifier = .invalid

    @objc func setPlaying(_ call: CAPPluginCall) {
        let playing = call.getBool("playing") ?? false

        DispatchQueue.main.async {
            do {
                let session = AVAudioSession.sharedInstance()
                if playing {
                    // Ensure session is .playback so audio survives backgrounding
                    try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
                    try session.setActive(true)
                    // Request a background task — gives us time for the audio to hand off
                    if self.bgTask == .invalid {
                        self.bgTask = UIApplication.shared.beginBackgroundTask(withName: "PalanteSoundscape") {
                            // Expiry handler — iOS is reclaiming time, clean up gracefully
                            UIApplication.shared.endBackgroundTask(self.bgTask)
                            self.bgTask = .invalid
                        }
                    }
                } else {
                    if self.bgTask != .invalid {
                        UIApplication.shared.endBackgroundTask(self.bgTask)
                        self.bgTask = .invalid
                    }
                    try session.setActive(false, options: .notifyOthersOnDeactivation)
                }
            } catch {
                print("⚠️ PalanteAudioBridge setPlaying error: \(error)")
            }
        }

        call.resolve()
    }
}
