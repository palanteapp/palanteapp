import Foundation
import UIKit
import Capacitor
import AVFoundation

/// Owns the app's AVAudioSession on behalf of the Soundscapes mixer.
///
/// ── Why this file does more than start a session ────────────────────────────
/// The recurring ~1s soundscape dropout was hunted five times in the JS loop
/// engine and was never there. Loop wraps on the buffer path are performed by
/// the Web Audio rendering thread (AudioBufferSourceNode.loop) with no
/// JavaScript per cycle, and the dropout hit sounds whose loop lengths differ
/// by 5x (cat-purring 10.9s, box-fan 53.9s) at the same felt rhythm. Nothing
/// synchronised to the loop point can do that. Something was interrupting the
/// whole graph.
///
/// Two things were, and both live here:
///
///   1. NOTHING OBSERVED AVAudioSession.interruptionNotification. Every
///      interruption — a notification that plays a sound, Siri, a call, another
///      app taking audio, an alarm — deactivates the session and stops
///      playback. iOS does NOT bring you back: `.ended` is an invitation to
///      call setActive(true) yourself, and nobody was listening for it. So
///      every interruption punched a hole in playback and the Web Audio graph
///      came back only when WebKit got around to it.
///
///   2. setPlaying() RECONFIGURED A LIVE SESSION. setCategory + setActive on a
///      session that is already active tears down and rebuilds the audio unit
///      WKWebView renders into — audible every time. It ran on every change of
///      the active-sound count, and playBell() did the same thing on every
///      interval bell, so a meditation with bells dropped audio on each one.
///
/// Both are now handled: the session is configured once and only re-touched
/// when the desired state actually changes, interruptions are observed and
/// recovered from, and JS is told what happened so it can resume its own graph.
@objc(PalanteAudioBridgePlugin)
public class PalanteAudioBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PalanteAudioBridgePlugin"
    public let jsName = "PalanteAudioBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setPlaying", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "playBell", returnType: CAPPluginReturnPromise),
    ]

    private var bgTask: UIBackgroundTaskIdentifier = .invalid
    private var bellPlayer: AVAudioPlayer?

    /// What JS last asked for. The session is only re-touched when this
    /// changes, so a steady soundscape never has its audio unit rebuilt.
    private var wantsPlayback = false
    /// True while this plugin believes the session is configured and active.
    private var sessionActive = false

    public override func load() {
        let nc = NotificationCenter.default
        let session = AVAudioSession.sharedInstance()
        nc.addObserver(self, selector: #selector(handleInterruption(_:)),
                       name: AVAudioSession.interruptionNotification, object: session)
        nc.addObserver(self, selector: #selector(handleRouteChange(_:)),
                       name: AVAudioSession.routeChangeNotification, object: session)
        // The audio server can crash and restart. Every object created against
        // the old one is dead; the session must be rebuilt from scratch.
        nc.addObserver(self, selector: #selector(handleMediaServicesReset(_:)),
                       name: AVAudioSession.mediaServicesWereResetNotification, object: session)
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    // MARK: - Session

    /// Configure and activate the session, skipping calls that would be no-ops.
    ///
    /// `setActive(true)` immediately after an interruption ends can throw while
    /// the interrupting app is still tearing its own session down, so one
    /// delayed retry is built in — without it a Siri invocation or a phone call
    /// can leave the soundscape silent for the rest of the session.
    private func activateSession(retriesLeft: Int = 2) {
        let session = AVAudioSession.sharedInstance()
        do {
            if session.category != .playback {
                try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            }
            try session.setActive(true)
            sessionActive = true
        } catch {
            sessionActive = false
            if retriesLeft > 0 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                    self.activateSession(retriesLeft: retriesLeft - 1)
                }
            } else {
                print("PalanteAudioBridge: session activation failed: \(error)")
            }
        }
    }

    private func emit(_ event: String, _ data: [String: Any]) {
        DispatchQueue.main.async { self.notifyListeners(event, data: data) }
    }

    // MARK: - Interruption handling

    @objc private func handleInterruption(_ note: Notification) {
        guard let info = note.userInfo,
              let raw = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }

        switch type {
        case .began:
            // The session is already deactivated by the time this arrives.
            sessionActive = false
            emit("audioInterruption", ["state": "began", "shouldResume": false])

        case .ended:
            var shouldResume = false
            if let optsRaw = info[AVAudioSessionInterruptionOptionKey] as? UInt {
                shouldResume = AVAudioSession.InterruptionOptions(rawValue: optsRaw)
                    .contains(.shouldResume)
            }
            // Reactivate whenever the mixer still wants to play, rather than
            // only when iOS suggests it. For continuous ambient playback the
            // user's expectation is that the bed comes back; `shouldResume` is
            // forwarded to JS so it can still distinguish the two cases.
            if wantsPlayback { activateSession() }
            emit("audioInterruption", ["state": "ended", "shouldResume": shouldResume])

        @unknown default:
            break
        }
    }

    @objc private func handleRouteChange(_ note: Notification) {
        guard let info = note.userInfo,
              let raw = info[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: raw) else { return }
        // Headphones pulled or a Bluetooth device dropped: iOS pauses playback
        // and does not restart it. JS decides whether to resume.
        if reason == .oldDeviceUnavailable {
            emit("audioRouteChange", ["reason": "oldDeviceUnavailable"])
        }
    }

    @objc private func handleMediaServicesReset(_ note: Notification) {
        sessionActive = false
        bellPlayer = nil
        if wantsPlayback { activateSession() }
        emit("audioInterruption", ["state": "mediaServicesReset", "shouldResume": true])
    }

    // MARK: - JS API

    /// Plays the timer-completion bell natively under the .playback session,
    /// which sounds even when the hardware ring/silent switch is muted.
    /// (WKWebView's Web Audio is silenced by the mute switch; AVAudioPlayer is not.)
    @objc func playBell(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            // Deliberately does NOT reconfigure the session when one is already
            // active: doing that on every interval bell rebuilt the audio unit
            // and dropped the soundscape underneath the bell each time.
            if !self.sessionActive { self.activateSession() }

            guard let url = Bundle.main.url(forResource: "bell", withExtension: "caf") else {
                call.reject("bell.caf not found in app bundle")
                return
            }
            do {
                let player = try AVAudioPlayer(contentsOf: url)
                player.volume = 1.0
                player.prepareToPlay()
                player.play()
                self.bellPlayer = player
                call.resolve()
            } catch {
                call.reject("Bell playback failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func setPlaying(_ call: CAPPluginCall) {
        let playing = call.getBool("playing") ?? false

        DispatchQueue.main.async {
            // No-op when the request has not actually changed. This is the
            // guard that stops a live session being reconfigured every time the
            // active-sound count moves — which was audible as a dropout on
            // every layer the user added or removed.
            let alreadySatisfied = playing == self.wantsPlayback
                && (!playing || self.sessionActive)
            if alreadySatisfied {
                call.resolve()
                return
            }

            self.wantsPlayback = playing

            if playing {
                self.activateSession()
                // Buys time for the audio to hand off cleanly at backgrounding.
                if self.bgTask == .invalid {
                    self.bgTask = UIApplication.shared.beginBackgroundTask(withName: "PalanteSoundscape") {
                        UIApplication.shared.endBackgroundTask(self.bgTask)
                        self.bgTask = .invalid
                    }
                }
            } else {
                if self.bgTask != .invalid {
                    UIApplication.shared.endBackgroundTask(self.bgTask)
                    self.bgTask = .invalid
                }
                do {
                    try AVAudioSession.sharedInstance()
                        .setActive(false, options: .notifyOthersOnDeactivation)
                } catch {
                    print("PalanteAudioBridge: session deactivation failed: \(error)")
                }
                self.sessionActive = false
            }

            call.resolve()
        }
    }
}
