import UIKit

// Plain (pre-scene) UIKit lifecycle on purpose: this app is one window showing
// one canvas. There is no state restoration to model and no multi-window story
// worth the UISceneManifest ceremony.
@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let w = UIWindow(frame: UIScreen.main.bounds)
        w.rootViewController = GameViewController()
        w.backgroundColor = .crabShackVoid
        window = w
        w.makeKeyAndVisible()
        return true
    }
}

extension UIColor {
    /// index.html's page background (#10182c). The native view uses the same
    /// value so the letterbox around the canvas is invisible - on a phone the
    /// safe-area inset is a real band of pixels, and a mismatch reads as a bug.
    static let crabShackVoid = UIColor(red: 0x10 / 255.0, green: 0x18 / 255.0, blue: 0x2c / 255.0, alpha: 1)
}
