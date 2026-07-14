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

    public static func presentPaywall(from viewController: UIViewController? = nil) {
        guard presentedController == nil else { return }
        guard let host = viewController ?? topViewController() else { return }

        let paywall = UIHostingController(rootView: RepLockPaywallView())
        paywall.modalPresentationStyle = .pageSheet
        if let sheet = paywall.sheetPresentationController {
            sheet.detents = [.large()]
            sheet.prefersGrabberVisible = true
        }
        presentedController = paywall
        paywall.presentationController?.delegate = PresentationDelegate.shared
        host.present(paywall, animated: true)
    }

    public static func presentCustomerCenter(from viewController: UIViewController? = nil) {
        guard presentedController == nil else { return }
        guard let host = viewController ?? topViewController() else { return }

        let center = UIHostingController(rootView: RepLockCustomerCenterView())
        center.modalPresentationStyle = .pageSheet
        if let sheet = center.sheetPresentationController {
            sheet.detents = [.large()]
            sheet.prefersGrabberVisible = true
        }
        presentedController = center
        center.presentationController?.delegate = PresentationDelegate.shared
        host.present(center, animated: true)
    }

    fileprivate static func clearPresentedReference() {
        presentedController = nil
    }
}

private final class PresentationDelegate: NSObject, UIAdaptivePresentationControllerDelegate {
    static let shared = PresentationDelegate()

    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        PaywallPresenter.clearPresentedReference()
    }
}
