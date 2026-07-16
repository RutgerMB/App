import SwiftUI
import RevenueCat
import RevenueCatUI

/// Server-driven RevenueCat paywall with optional Customer Center entry point.
public struct RepLockPaywallView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var showCustomerCenter = false
    @State private var resolvedOffering: Offering?

    private let offering: Offering?

    public init(offering: Offering? = nil) {
        self.offering = offering
    }

    public var body: some View {
        NavigationStack {
            Group {
                if let offering = offering ?? resolvedOffering {
                    PaywallView(offering: offering)
                } else {
                    // Fallback while loading — still prefers Current / `defaults` once resolved.
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .task {
                guard offering == nil, resolvedOffering == nil else { return }
                resolvedOffering = try? await RevenueCatManager.shared.getCurrentOffering()
            }
            .onPurchaseCompleted { customerInfo in
                Task { @MainActor in
                    let info = (try? await RevenueCatManager.shared.refreshCustomerInfo()) ?? customerInfo
                    RepLockRevenueCatPlugin.notifyCustomerInfoUpdated(info)
                    PaywallPresenter.clearPresentedReference()
                    dismiss()
                }
            }
            .onRestoreCompleted { customerInfo in
                Task { @MainActor in
                    let info = (try? await RevenueCatManager.shared.refreshCustomerInfo()) ?? customerInfo
                    RepLockRevenueCatPlugin.notifyCustomerInfoUpdated(info)
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showCustomerCenter = true
                    } label: {
                        Image(systemName: "person.crop.circle")
                    }
                    .accessibilityLabel("Manage subscription")
                }
            }
            .sheet(isPresented: $showCustomerCenter) {
                RepLockCustomerCenterView()
            }
        }
    }
}

/// RevenueCat Customer Center for subscription management, refunds, and restore.
public struct RepLockCustomerCenterView: View {
    @Environment(\.dismiss) private var dismiss

    public init() {}

    public var body: some View {
        NavigationStack {
            CustomerCenterView()
                .onCustomerCenterRestoreCompleted { _ in
                    Task { @MainActor in
                        if let info = try? await RevenueCatManager.shared.refreshCustomerInfo() {
                            RepLockRevenueCatPlugin.notifyCustomerInfoUpdated(info)
                        }
                    }
                }
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("Close") { dismiss() }
                    }
                }
        }
    }
}

/// Entitlement-gated modifier — presents paywall when user lacks RepLocks Pro.
public struct RepLockPaywallGate: ViewModifier {
    @State private var showPaywall = false

    public func body(content: Content) -> some View {
        content
            .onAppear {
                showPaywall = !RevenueCatManager.shared.hasProEntitlement()
            }
            .sheet(isPresented: $showPaywall) {
                RepLockPaywallView()
            }
    }
}

public extension View {
    func repLockPaywallIfNeeded() -> some View {
        modifier(RepLockPaywallGate())
    }
}
