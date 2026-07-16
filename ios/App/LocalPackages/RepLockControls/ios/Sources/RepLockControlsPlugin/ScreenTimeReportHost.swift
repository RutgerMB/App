import DeviceActivity
import Foundation
import SwiftUI
import UIKit

@available(iOS 16.0, *)
extension DeviceActivityReport.Context {
    /// Must match the DeviceActivityReport extension scene context string.
    static let repLockTotalActivity = Self(ScreenTimeSharedKeys.reportContextRawValue)
}

@available(iOS 16.0, *)
private struct ScreenTimeReportProbeView: View {
    private var todayFilter: DeviceActivityFilter {
        let calendar = Calendar.current
        let now = Date()
        let interval = calendar.dateInterval(of: .day, for: now)
            ?? DateInterval(start: calendar.startOfDay(for: now), end: now)
        return DeviceActivityFilter(segment: .daily(during: interval))
    }

    var body: some View {
        DeviceActivityReport(.repLockTotalActivity, filter: todayFilter)
            .frame(maxWidth: .infinity, minHeight: 100, maxHeight: 140)
    }
}

/// Hosts `DeviceActivityReport` **only** inside an explicit user-facing sheet.
///
/// Never auto-present a naked report over the WebView — App Group export from the
/// extension is blocked on device, so polling via on-screen hosts only causes
/// black "6h9m" flashes and never unlocks numeric JS data.
@available(iOS 16.0, *)
enum ScreenTimeReportHost {
    /// Prevents stacking sheets / re-present on every refresh or minute tick.
    @MainActor private static weak var activeVisibleHost: UIViewController?

    /// Best-effort App Group read only — **does not present UI**.
    @MainActor
    static func refresh(from presenter: UIViewController?, force: Bool = false) async -> ScreenTimeSharedStore.Snapshot? {
        _ = presenter
        _ = force
        return ScreenTimeSharedStore.readTodaySnapshot()
    }

    /// Premium sheet embedding DeviceActivityReport. Resolves when the user taps
    /// Continue/Done (or the sheet is otherwise dismissed). Call once per user action.
    @MainActor
    static func presentVisibleReport(from presenter: UIViewController?) async -> Bool {
        guard let parent = topPresenter(from: presenter) else { return false }
        if activeVisibleHost != nil { return false }
        if parent.presentedViewController != nil {
            // Another modal is up — don't steal or stack a naked report.
            return false
        }

        final class Box: NSObject {
            weak var host: UIViewController?
            var onDismiss: (() -> Void)?
            /// Retained — `presentationController.delegate` is weak.
            var dismissBridge: DismissBridge?
        }
        let box = Box()

        let root = VisibleScreenTimeReportSheet(
            onContinue: {
                box.host?.dismiss(animated: true) {
                    box.onDismiss?()
                }
            }
        )

        let host = UIHostingController(rootView: root)
        box.host = host
        activeVisibleHost = host
        host.modalPresentationStyle = .pageSheet
        if let sheet = host.sheetPresentationController {
            sheet.detents = [.medium(), .large()]
            sheet.prefersGrabberVisible = true
            sheet.preferredCornerRadius = 28
        }
        host.overrideUserInterfaceStyle = .dark

        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            var resumed = false
            let finish = {
                guard !resumed else { return }
                resumed = true
                if ScreenTimeReportHost.activeVisibleHost === host {
                    ScreenTimeReportHost.activeVisibleHost = nil
                }
                cont.resume()
            }
            box.onDismiss = finish
            let bridge = DismissBridge(onDismiss: finish)
            box.dismissBridge = bridge

            parent.present(host, animated: true) {
                host.presentationController?.delegate = bridge
            }
        }

        return true
    }

    @MainActor
    private static func topPresenter(from presenter: UIViewController?) -> UIViewController? {
        var root = presenter
        if root == nil {
            let scenes = UIApplication.shared.connectedScenes
            let windowScene = scenes.first { $0.activationState == .foregroundActive } as? UIWindowScene
            root = windowScene?.windows.first { $0.isKeyWindow }?.rootViewController
        }
        while let presented = root?.presentedViewController {
            root = presented
        }
        return root
    }
}

@available(iOS 16.0, *)
private struct VisibleScreenTimeReportSheet: View {
    var onContinue: () -> Void

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [
                        Color(red: 0.07, green: 0.08, blue: 0.14),
                        Color(red: 0.10, green: 0.09, blue: 0.20),
                        Color(red: 0.06, green: 0.07, blue: 0.12),
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                VStack(spacing: 20) {
                    Text("REALITY CHECK")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(2.2)
                        .foregroundStyle(Color.white.opacity(0.45))

                    Text("Your actual screen time")
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)

                    Text("Apple measured this on your iPhone today. RepLock shows the system total here first, then sends you back to finish setup with context.")
                        .font(.system(size: 14, weight: .regular))
                        .foregroundStyle(Color.white.opacity(0.5))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 8)

                    ScreenTimeReportProbeView()
                        .padding(.vertical, 8)
                        .padding(.horizontal, 4)
                        .background(
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .fill(Color.white.opacity(0.04))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                                )
                        )
                        .padding(.horizontal, 4)

                    Spacer(minLength: 8)

                    Button(action: onContinue) {
                        Text("Continue setup")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .background(
                                LinearGradient(
                                    colors: [
                                        Color(red: 0.39, green: 0.40, blue: 0.95),
                                        Color(red: 0.55, green: 0.36, blue: 0.96),
                                    ],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 4)
                    .padding(.bottom, 8)
                }
                .padding(.horizontal, 24)
                .padding(.top, 28)
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { onContinue() }
                        .foregroundStyle(Color.white.opacity(0.7))
                }
            }
        }
    }
}

/// Bridges swipe-to-dismiss into the async continuation.
final class DismissBridge: NSObject, UIAdaptivePresentationControllerDelegate {
    private let onDismiss: () -> Void

    init(onDismiss: @escaping () -> Void) {
        self.onDismiss = onDismiss
    }

    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        onDismiss()
    }
}
