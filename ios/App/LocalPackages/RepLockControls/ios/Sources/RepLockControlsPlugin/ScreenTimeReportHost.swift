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
    /// When true, use a large readable style (user-facing sheet).
    var prominent: Bool = false

    private var todayFilter: DeviceActivityFilter {
        let calendar = Calendar.current
        let now = Date()
        let interval = calendar.dateInterval(of: .day, for: now)
            ?? DateInterval(start: calendar.startOfDay(for: now), end: now)
        return DeviceActivityFilter(segment: .daily(during: interval))
    }

    var body: some View {
        DeviceActivityReport(.repLockTotalActivity, filter: todayFilter)
            .frame(
                maxWidth: .infinity,
                minHeight: prominent ? 120 : 80,
                maxHeight: prominent ? 160 : 120
            )
            // DeviceActivityReport often will not execute when offscreen / zero-size /
            // fully invisible. Keep a real laid-out frame on screen.
            .opacity(1)
            .accessibilityHidden(!prominent)
    }
}

/// Hosts `DeviceActivityReport` so the report extension can run.
///
/// Important: on physical devices the DeviceActivityReport extension sandbox
/// **blocks App Group / UserDefaults writes** (Apple privacy design). The host
/// can still *display* totals via the report view; numeric export to JS may
/// remain unavailable. Simulator often allows App Group writes — treat that as
/// best-effort only.
@available(iOS 16.0, *)
enum ScreenTimeReportHost {
    private static let pollIntervalNs: UInt64 = 250_000_000
    /// First report after authorize can take several seconds on device.
    private static let timeout: TimeInterval = 14.0

    @MainActor
    static func refresh(from presenter: UIViewController?, force: Bool = false) async -> ScreenTimeSharedStore.Snapshot? {
        if !force, let cached = ScreenTimeSharedStore.readTodaySnapshot(), cached.isFresh() {
            return cached
        }

        let baselineUpdatedAt = ScreenTimeSharedStore.readSnapshot()?.updatedAt ?? .distantPast

        guard let parent = topPresenter(from: presenter) else {
            return await pollForSnapshot(baselineUpdatedAt: baselineUpdatedAt, force: force, timeout: 3.0)
        }

        // Present a real on-screen host. Tiny / alpha≈0 child views often never
        // launch ExtensionKit (`Failed to locate container app bundle record`).
        let host = UIHostingController(rootView: ScreenTimeReportProbeView(prominent: false))
        host.view.backgroundColor = UIColor.systemBackground.withAlphaComponent(0.02)
        host.modalPresentationStyle = .overFullScreen
        host.modalTransitionStyle = .crossDissolve
        host.view.isUserInteractionEnabled = false

        await present(host, from: parent)
        host.view.setNeedsLayout()
        host.view.layoutIfNeeded()

        let latest = await pollForSnapshot(
            baselineUpdatedAt: baselineUpdatedAt,
            force: force,
            timeout: timeout
        )

        await dismiss(host)
        return latest ?? ScreenTimeSharedStore.readTodaySnapshot()
    }

    /// User-visible sheet so the extension renders today's total on screen.
    @MainActor
    static func presentVisibleReport(from presenter: UIViewController?) async -> Bool {
        guard let parent = topPresenter(from: presenter) else { return false }

        final class Box: NSObject {
            weak var host: UIViewController?
        }
        let box = Box()

        let root = NavigationStack {
            VStack(spacing: 16) {
                Text("Today's screen time")
                    .font(.headline)
                ScreenTimeReportProbeView(prominent: true)
                    .padding(.horizontal)
                Text("Measured by Screen Time on this iPhone.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                Spacer(minLength: 0)
            }
            .padding(.top, 24)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        box.host?.dismiss(animated: true)
                    }
                }
            }
        }

        let host = UIHostingController(rootView: root)
        box.host = host
        host.modalPresentationStyle = .pageSheet
        if let sheet = host.sheetPresentationController {
            sheet.detents = [.medium()]
            sheet.prefersGrabberVisible = true
        }

        await present(host, from: parent)
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

    @MainActor
    private static func present(_ host: UIViewController, from parent: UIViewController) async {
        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            if parent.presentedViewController === host {
                cont.resume()
                return
            }
            parent.present(host, animated: false) {
                cont.resume()
            }
        }
    }

    @MainActor
    private static func dismiss(_ host: UIViewController) async {
        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            guard host.presentingViewController != nil else {
                cont.resume()
                return
            }
            host.dismiss(animated: false) {
                cont.resume()
            }
        }
    }

    @MainActor
    private static func pollForSnapshot(
        baselineUpdatedAt: Date,
        force: Bool,
        timeout: TimeInterval
    ) async -> ScreenTimeSharedStore.Snapshot? {
        let deadline = Date().addingTimeInterval(timeout)
        var latest = ScreenTimeSharedStore.readTodaySnapshot()

        while Date() < deadline {
            if let snap = ScreenTimeSharedStore.readTodaySnapshot() {
                let isNew = snap.updatedAt > baselineUpdatedAt
                let usable = force ? isNew || snap.isFresh(maxAge: 300) : (isNew || snap.isFresh())
                if usable {
                    return snap
                }
                latest = snap
            }
            try? await Task.sleep(nanoseconds: pollIntervalNs)
        }

        return latest ?? ScreenTimeSharedStore.readTodaySnapshot()
    }
}
