import UIKit
import WebKit
import AVFoundation

final class GameViewController: UIViewController {
    private var web: WKWebView!
    private var bridge: SaveBridge!

    override func loadView() {
        let root = Bundle.main.url(forResource: "www", withExtension: nil)!
        let cfg = WKWebViewConfiguration()
        cfg.setURLSchemeHandler(BundleSchemeHandler(root: root), forURLScheme: BundleSchemeHandler.scheme)

        // The music starts itself once the player has touched the title screen;
        // requiring a *second* gesture inside WebKit would silently mute it.
        cfg.allowsInlineMediaPlayback = true
        cfg.mediaTypesRequiringUserActionForPlayback = []
        cfg.suppressesIncrementalRendering = true

        bridge = SaveBridge()
        cfg.userContentController.add(WeakMessageProxy(bridge), name: SaveBridge.name)

        web = WKWebView(frame: .zero, configuration: cfg)
        web.isOpaque = false
        web.backgroundColor = .crabShackVoid
        web.scrollView.backgroundColor = .crabShackVoid
        web.scrollView.isScrollEnabled = false          // the canvas owns every gesture
        web.scrollView.bounces = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.allowsBackForwardNavigationGestures = false
        // Safari Web Inspector. Gated because the property arrived in 16.4 and
        // the deployment floor is 16.0 - dropping the floor to reach a debug
        // affordance would be the wrong way round.
        if #available(iOS 16.4, *) { web.isInspectable = true }

        let container = UIView()
        container.backgroundColor = .crabShackVoid
        container.addSubview(web)
        web.translatesAutoresizingMaskIntoConstraints = false
        // Pinned to the SAFE AREA, not the screen: index.html centres the bezel
        // in the viewport, so an edge-to-edge webview would park the home
        // indicator on top of the game's bottom rows. The band this leaves is
        // painted the page's own background, so it reads as the page.
        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: container.safeAreaLayoutGuide.topAnchor),
            web.bottomAnchor.constraint(equalTo: container.safeAreaLayoutGuide.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: container.safeAreaLayoutGuide.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: container.safeAreaLayoutGuide.trailingAnchor),
        ])
        view = container
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        bridge.host = self

        // .ambient + mixWithOthers: the mute switch silences the shack, and
        // someone else's podcast survives launching it. A game is not a reason
        // to seize the audio session.
        try? AVAudioSession.sharedInstance().setCategory(.ambient, options: [.mixWithOthers])
        try? AVAudioSession.sharedInstance().setActive(true)

        var c = URLComponents()
        c.scheme = BundleSchemeHandler.scheme
        c.host = BundleSchemeHandler.host
        c.path = "/index.html"
        web.load(URLRequest(url: c.url!))
    }

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
}

/// WKUserContentController retains its message handlers, and the handler here
/// holds the view controller - a strong pair would leak the whole web view.
final class WeakMessageProxy: NSObject, WKScriptMessageHandler {
    private weak var target: WKScriptMessageHandler?
    init(_ target: WKScriptMessageHandler) { self.target = target }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        target?.userContentController(c, didReceive: m)
    }
}
