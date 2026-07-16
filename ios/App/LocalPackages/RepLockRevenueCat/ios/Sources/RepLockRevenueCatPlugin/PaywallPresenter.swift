import UIKit
import SwiftUI

/// UIHostingController that notifies PaywallPresenter when dismissed (swipe or Close).
@MainActor
private final class TrackedHostingController<Content: View>: UIHostingController<Content> {
    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        if isBeingDismissed || presentingViewController == nil {
            PaywallPresenter.clearPresentedReference()
        }
    }
}

@MainActor
public enum PaywallPresenter {
    private static weak var presentedController: UIViewController?
    private static var dismissContinuations: [CheckedContinuation<Void, Never>] = []

    public static func topViewController() -> UIViewController? {
        let scenes = UIApplication.shared.connectedScenes
        let windowScene = scenes.first { $0.activationState == .foregroundActive } as? UIWindowScene
        var root = windowScene?.windows.first { $0.isKeyWindow }?.rootViewController
        while let presented = root?.presentedViewController {
            root = presented
        }
        return root
    }

    /// Present paywall and wait until it is dismissed (purchase, close, or swipe).
    public static func presentPaywallAndWait(from viewController: UIViewController? = nil) async -> Bool {
        if presentedController != nil {
            await waitUntilDismissed()
            return true
        }
        guard let host = viewController ?? topViewController() else { return false }

        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            dismissContinuations.append(continuation)

            let paywall = TrackedHostingController(rootView: RepLockPaywallView())
            paywall.modalPresentationStyle = .pageSheet
            if let sheet = paywall.sheetPresentationController {
                sheet.detents = [.large()]
                sheet.prefersGrabberVisible = true
            }
            presentedController = paywall
            paywall.presentationController?.delegate = PresentationDelegate.shared
            host.present(paywall, animated: true)
        }
        return true
    }

    /// Returns `true` when a paywall sheet is shown (or already visible). Non-blocking.
    @discardableResult
    public static func presentPaywall(from viewController: UIViewController? = nil) -> Bool {
        if let existing = presentedController, existing.presentingViewController != nil {
            return true
        }
        clearPresentedReference()
        guard let host = viewController ?? topViewController() else { return false }

        let paywall = TrackedHostingController(rootView: RepLockPaywallView())
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

    /// Present Customer Center and wait until it is dismissed.
    public static func presentCustomerCenterAndWait(from viewController: UIViewController? = nil) async -> Bool {
        if presentedController != nil {
            await waitUntilDismissed()
        }
        guard presentedController == nil else { return true }
        guard let host = viewController ?? topViewController() else { return false }

        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            dismissContinuations.append(continuation)

            let center = TrackedHostingController(rootView: RepLockCustomerCenterView())
            center.modalPresentationStyle = .pageSheet
            if let sheet = center.sheetPresentationController {
                sheet.detents = [.large()]
                sheet.prefersGrabberVisible = true
            }
            presentedController = center
            center.presentationController?.delegate = PresentationDelegate.shared
            host.present(center, animated: true)
        }
        return true
    }

    /// Returns `true` when Customer Center is shown. Prefer `presentCustomerCenterAndWait` from plugins.
    @discardableResult
    public static func presentCustomerCenter(from viewController: UIViewController? = nil) -> Bool {
        if let existing = presentedController, existing.presentingViewController != nil {
            return true
        }
        clearPresentedReference()
        guard let host = viewController ?? topViewController() else { return false }

        let center = TrackedHostingController(rootView: RepLockCustomerCenterView())
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
        let pending = dismissContinuations
        dismissContinuations = []
        for continuation in pending {
            continuation.resume()
        }
    }

    private static func waitUntilDismissed() async {
        guard presentedController != nil else { return }
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            dismissContinuations.append(continuation)
        }
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
