import UIKit
import SwiftUI

@MainActor
public enum PaywallPresenter {
    private static weak var presentedController: UIViewController?

    public static func topViewController() -> UIViewController? {
        let scenes = UIApplication.shared.connectedScenes
        let windowScene = scenes.first { $0.activationState == .foregroundActive } as? UIWindowScene
        var root = windowScene?.windows.first { $0.isKeyWindow }?.rootViewController
        while let presented = root?.presentedViewController {
            root = presented
        }
        return root
    }

    /// Returns `true` when a paywall sheet is shown (or already visible).
    @discardableResult
    public static func presentPaywall(from viewController: UIViewController? = nil) -> Bool {
        if presentedController != nil { return true }
        guard let host = viewController ?? topViewController() else { return false }

        let paywall = UIHostingController(rootView: RepLockPaywallView())
        paywall.modalPresentationStyle = .pageSheet
        if let sheet = paywall.sheetPresentationController {
            sheet.detents = [.large()]
            sheet.prefersGrabberVisible = true
        }
        presentedController = paywall
        paywall.presentationController?.delegate = PresentationDelegate.shared
        host.present(paywall, animated: true)
        return true
    }

    /// Returns `true` when Customer Center is shown (or already visible).
    @discardableResult
    public static func presentCustomerCenter(from viewController: UIViewController? = nil) -> Bool {
        if presentedController != nil { return true }
        guard let host = viewController ?? topViewController() else { return false }

        let center = UIHostingController(rootView: RepLockCustomerCenterView())
        center.modalPresentationStyle = .pageSheet
        if let sheet = center.sheetPresentationController {
            sheet.detents = [.large()]
            sheet.prefersGrabberVisible = true
        }
        presentedController = center
        center.presentationController?.delegate = PresentationDelegate.shared
        host.present(center, animated: true)
        return true
    }

    /// Clears the presented sheet reference (e.g. after programmatic dismiss).
    public static func clearPresentedReference() {
        presentedController = nil
    }
}

@MainActor
private final class PresentationDelegate: NSObject, UIAdaptivePresentationControllerDelegate {
    static let shared = PresentationDelegate()

    nonisolated func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        Task { @MainActor in
            PaywallPresenter.clearPresentedReference()
        }
    }
}
