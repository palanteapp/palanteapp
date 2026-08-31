import Foundation
import AVFoundation

/// A native, per-track looping engine used ONLY for the persistent ambient
/// soundscape beds (Soundscapes mixer + koi pond).
///
/// ── Why this exists ──────────────────────────────────────────────────────
/// Every prior fix for the recurring dropout worked on the Web Audio graph
/// running inside WKWebView, because that graph looked like the only place
/// a JS-visible fault could live. It is not: WKWebView's own Web Audio
/// implementation has a documented history of silently stalling on iOS,
/// independent of anything the app does —
///   - WebKit bug 237878: "AudioContext is suspended on iOS when page is
///     backgrounded."
///   - Multiple independent Apple Developer Forum reports of every
///     AudioContext inside a backgrounded WKWebView freezing after ~27s,
///     and of playback that stops and never resumes even when the app is
///     brought back to the foreground.
/// No amount of correctness in loopEngine.ts or PalanteAudioBridge's session
/// handling reaches that class of fault, because it is not in app code.
///
/// AVAudioEngine here is a wholly separate native audio unit from
/// WKWebView's — it is not subject to that failure mode. This mirrors the
/// web engine's already-correct approach (decode once, slice to the
/// manifest's exact `loopSeconds`, let the render thread wrap the buffer
/// with zero per-cycle scheduling): `AVAudioPlayerNode.scheduleBuffer` with
/// the `.loops` option loops a PCM buffer sample-exactly, the same way
/// `AudioBufferSourceNode.loop = true` does on the web side.
final class PalanteNativeLoopEngine {
    static let shared = PalanteNativeLoopEngine()
    private init() {}

    private let engine = AVAudioEngine()
    private var players: [String: AVAudioPlayerNode] = [:]
    /// Decoded+sliced buffers, cached by resolved file path (not track id) so
    /// two simultaneous tracks playing the same file share one decode.
    private var buffers: [String: AVAudioPCMBuffer] = [:]
    private var engineStarted = false

    private func ensureEngineRunning() throws {
        if engineStarted && engine.isRunning { return }
        try engine.start()
        engineStarted = true
    }

    /// Resolves a manifest-relative path ("sounds/flowing-river.m4a") to the
    /// file Capacitor copied into the app bundle's `public/` folder at sync
    /// time — the same file the web engine decodes, so both paths play
    /// identical, already-loop-verified audio.
    private func resolveURL(_ relativePath: String) -> URL? {
        guard let publicDir = Bundle.main.url(forResource: "public", withExtension: nil) else {
            return nil
        }
        let url = publicDir.appendingPathComponent(relativePath)
        return FileManager.default.fileExists(atPath: url.path) ? url : nil
    }

    private func loadBuffer(url: URL, loopSeconds: Double?) throws -> AVAudioPCMBuffer {
        let key = url.path
        if let cached = buffers[key] { return cached }

        let file = try AVAudioFile(forReading: url)
        let format = file.processingFormat
        let totalFrames = AVAudioFrameCount(file.length)

        // Slice to the manifest's exact loop length — the same trustworthy
        // source loopEngine.ts uses, so the native path loops at the same
        // correlation-matched seam the offline baker already verified.
        // Falls back to the whole file only for a track with no manifest
        // entry (there should be none in the library, but a missing entry
        // must not mean silence).
        let frameCount: AVAudioFrameCount
        if let loopSeconds, loopSeconds > 0 {
            let sliced = AVAudioFrameCount(loopSeconds * format.sampleRate)
            frameCount = min(sliced, totalFrames)
        } else {
            frameCount = totalFrames
        }

        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            throw NSError(domain: "PalanteNativeLoopEngine", code: 1,
                           userInfo: [NSLocalizedDescriptionKey: "PCM buffer allocation failed for \(url.lastPathComponent)"])
        }
        try file.read(into: buffer, frameCount: frameCount)
        buffers[key] = buffer
        return buffer
    }

    /// Starts (or restarts) a looping track. Replacing any existing voice
    /// under the same id mirrors the guarantee MixerSound already gives on
    /// the web side: a fast off/on can't leave two loops of one sound
    /// running under one another.
    func start(id: String, relativePath: String, loopSeconds: Double?, volume: Float) throws {
        stop(id: id)

        guard let url = resolveURL(relativePath) else {
            throw NSError(domain: "PalanteNativeLoopEngine", code: 2,
                           userInfo: [NSLocalizedDescriptionKey: "sound file not found in bundle: \(relativePath)"])
        }
        let buffer = try loadBuffer(url: url, loopSeconds: loopSeconds)

        let player = AVAudioPlayerNode()
        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: buffer.format)
        player.volume = max(0, min(1, volume))

        try ensureEngineRunning()

        player.scheduleBuffer(buffer, at: nil, options: .loops, completionHandler: nil)
        player.play()

        players[id] = player
    }

    func setVolume(id: String, volume: Float) {
        players[id]?.volume = max(0, min(1, volume))
    }

    func stop(id: String) {
        guard let player = players.removeValue(forKey: id) else { return }
        player.stop()
        engine.disconnectNodeOutput(player)
        engine.detach(player)
    }

    func stopAll() {
        for id in Array(players.keys) { stop(id: id) }
    }

    /// Called after an AVAudioSession interruption ends or a media-services
    /// reset. Node graph topology (which tracks are attached, their buffers)
    /// survives an interruption, but the engine's render thread does not
    /// restart itself — unlike a WKWebView AudioContext, which per the
    /// WebKit/Apple reports above may not restart itself EITHER, but here we
    /// actually control the restart directly instead of hoping the browser
    /// gets around to it.
    func handleSessionReactivated() {
        guard engineStarted, !engine.isRunning else { return }
        try? engine.start()
    }
}
