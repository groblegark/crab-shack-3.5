import Foundation
import WebKit

/// Serves the generated `www/` payload over a custom `crabshack://` scheme.
///
/// WHY NOT `loadFileURL`: a `file://` document in WKWebView gets an opaque
/// security origin, and localStorage on an opaque origin is unreliable - it can
/// read back empty on a later launch. The entire save system is localStorage,
/// so that is not a gamble worth taking. A custom scheme gets a real, stable
/// origin (`crabshack://game`), which makes localStorage, WebAssembly and audio
/// behave exactly as they do on the live site.
///
/// WHY RANGE SUPPORT: WebKit's media loader asks for byte ranges even when the
/// game never seeks - the 22 music tracks arrive as `Range: bytes=0-` requests.
/// A handler that ignores Range and always answers 200 makes playback flaky in
/// a way that only shows up on a device.
final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "crabshack"
    static let host = "game"

    private let root: URL
    /// WKURLSchemeTask throws an ObjC exception if you touch it after `stop`.
    /// File reads happen off the main thread, so a task can be cancelled while
    /// its read is in flight - every response hop checks this set first.
    private var live = Set<ObjectIdentifier>()
    private let lock = NSLock()
    private let io = DispatchQueue(label: "crabshack.bundle.io", qos: .userInitiated)

    init(root: URL) {
        self.root = root.standardizedFileURL
        super.init()
    }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        let id = ObjectIdentifier(task)
        lock.lock(); live.insert(id); lock.unlock()

        guard let url = task.request.url, let file = resolve(url) else {
            finish(task, id, status: 404, headers: [:], body: Data())
            return
        }
        let range = task.request.value(forHTTPHeaderField: "Range")

        io.async { [weak self] in
            guard let self else { return }
            guard let whole = try? Data(contentsOf: file, options: .mappedIfSafe) else {
                self.finish(task, id, status: 404, headers: [:], body: Data())
                return
            }
            let type = Self.mime(for: file.pathExtension)
            if let r = Self.parseRange(range, count: whole.count) {
                let slice = whole.subdata(in: r)
                self.finish(task, id, status: 206, headers: [
                    "Content-Type": type,
                    "Content-Length": String(slice.count),
                    "Accept-Ranges": "bytes",
                    "Content-Range": "bytes \(r.lowerBound)-\(r.upperBound - 1)/\(whole.count)",
                ], body: slice)
            } else {
                self.finish(task, id, status: 200, headers: [
                    "Content-Type": type,
                    "Content-Length": String(whole.count),
                    "Accept-Ranges": "bytes",
                ], body: whole)
            }
        }
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {
        let id = ObjectIdentifier(task)
        lock.lock(); live.remove(id); lock.unlock()
    }

    // MARK: -

    /// Map a request URL onto a file under `root`, refusing anything that
    /// escapes it. `crabshack://game/` means index.html.
    private func resolve(_ url: URL) -> URL? {
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        // the game asks for tools/kernel/kernel-b64.js?v=... - the query is a
        // cache-buster for the live site and means nothing here
        let candidate = root.appendingPathComponent(path).standardizedFileURL
        guard candidate.path == root.path || candidate.path.hasPrefix(root.path + "/") else { return nil }
        guard FileManager.default.fileExists(atPath: candidate.path) else { return nil }
        return candidate
    }

    private func finish(_ task: WKURLSchemeTask, _ id: ObjectIdentifier,
                        status: Int, headers: [String: String], body: Data) {
        DispatchQueue.main.async {
            self.lock.lock()
            let alive = self.live.contains(id)
            if alive { self.live.remove(id) }
            self.lock.unlock()
            guard alive, let url = task.request.url else { return }
            let response = HTTPURLResponse(url: url, statusCode: status,
                                           httpVersion: "HTTP/1.1", headerFields: headers)!
            task.didReceive(response)
            task.didReceive(body)
            task.didFinish()
        }
    }

    /// `bytes=0-`, `bytes=100-200`. Anything else (multi-range, suffix ranges)
    /// answers 200 with the whole body, which is a legal response.
    static func parseRange(_ header: String?, count: Int) -> Range<Int>? {
        guard count > 0, let h = header?.trimmingCharacters(in: .whitespaces),
              h.hasPrefix("bytes="), !h.contains(",") else { return nil }
        let parts = h.dropFirst("bytes=".count).split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 2, let start = Int(parts[0]), start >= 0, start < count else { return nil }
        let end = parts[1].isEmpty ? count - 1 : (Int(parts[1]) ?? count - 1)
        guard end >= start else { return nil }
        return start ..< min(end + 1, count)
    }

    static func mime(for ext: String) -> String {
        switch ext.lowercased() {
        case "html", "htm": return "text/html; charset=utf-8"
        case "js", "mjs":   return "text/javascript; charset=utf-8"
        case "json":        return "application/json; charset=utf-8"
        case "css":         return "text/css; charset=utf-8"
        case "mp3":         return "audio/mpeg"
        case "wasm":        return "application/wasm"
        case "png":         return "image/png"
        case "svg":         return "image/svg+xml"
        case "woff2":       return "font/woff2"
        default:            return "application/octet-stream"
        }
    }
}
