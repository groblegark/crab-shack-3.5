import UIKit
import WebKit

/// The native half of "EXPORT SAVE".
///
/// On the web the game hands the player a Blob URL on an `<a download>`. In
/// WKWebView that anchor is INERT - the tap does nothing, no error, no file.
/// game.js detects this handler and posts the save here instead, and iOS shows
/// the share sheet, which can write to Files, AirDrop it, or mail it.
///
/// Import needs no bridge: `<input type="file">` opens the document picker in a
/// web view exactly as it does in Safari.
final class SaveBridge: NSObject, WKScriptMessageHandler {
    static let name = "crabshack"
    weak var host: UIViewController?

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let cmd = body["cmd"] as? String else { return }
        switch cmd {
        case "exportSave":
            guard let json = body["json"] as? String else { return }
            let name = (body["name"] as? String) ?? "crabshack-save.json"
            share(json: json, named: name)
        case "haptic":
            let style: UIImpactFeedbackGenerator.FeedbackStyle =
                (body["weight"] as? String) == "heavy" ? .medium : .light
            UIImpactFeedbackGenerator(style: style).impactOccurred()
        default:
            break
        }
    }

    private func share(json: String, named name: String) {
        guard let host else { return }
        // A file URL (not a raw string) so the share sheet offers "Save to
        // Files" with the right name and .json extension - a string only ever
        // offers to paste it somewhere.
        let safe = name.replacingOccurrences(of: "/", with: "-")
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(safe)
        do { try json.write(to: url, atomically: true, encoding: .utf8) } catch { return }

        let sheet = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        // iPad presents this as a popover and CRASHES without an anchor
        sheet.popoverPresentationController?.sourceView = host.view
        sheet.popoverPresentationController?.sourceRect = CGRect(
            x: host.view.bounds.midX, y: host.view.bounds.midY, width: 1, height: 1)
        sheet.popoverPresentationController?.permittedArrowDirections = []
        host.present(sheet, animated: true)
    }
}
