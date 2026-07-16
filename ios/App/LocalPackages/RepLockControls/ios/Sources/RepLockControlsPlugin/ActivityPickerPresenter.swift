import UIKit
import SwiftUI
import FamilyControls
import ManagedSettings

// MARK: - Picker

@available(iOS 16.0, *)
struct RepLockActivityPickerView: View {
    @Binding var selection: FamilyActivitySelection
    let onDone: () -> Void
    let onCancel: () -> Void

    var body: some View {
        NavigationStack {
            FamilyActivityPicker(selection: $selection)
                .navigationTitle("Choose apps")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel", action: onCancel)
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done", action: onDone)
                    }
                }
        }
    }
}

// MARK: - Confirmation (real Label(token) names + icons)

/// Shows Apple's privacy-safe `Label(ApplicationToken)` so the user sees the
/// real app name and icon. The host app still cannot read those strings into
/// JS — only user-typed display names are bridged (required before Save).
@available(iOS 16.0, *)
struct RepLockSelectedAppsConfirmView: View {
    let tokens: [ApplicationToken]
    let tokenIds: [String]
    @State private var displayNames: [String: String]
    let onConfirm: ([String: String]) -> Void
    let onCancel: () -> Void

    init(
        tokens: [ApplicationToken],
        tokenIds: [String],
        initialNames: [String: String],
        onConfirm: @escaping ([String: String]) -> Void,
        onCancel: @escaping () -> Void
    ) {
        self.tokens = tokens
        self.tokenIds = tokenIds
        self._displayNames = State(initialValue: initialNames)
        self.onConfirm = onConfirm
        self.onCancel = onCancel
    }

    private var allNamesFilled: Bool {
        guard !tokens.isEmpty else { return true }
        return tokenIds.allSatisfy { id in
            (displayNames[id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
        }
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Text(
                        "Apple shows each app’s real name and icon below. RepLock cannot read those into the app UI — type a nickname for every app so it shows up in the Apps tab."
                    )
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .listRowBackground(Color.clear)
                }

                Section("Selected apps") {
                    ForEach(Array(tokens.enumerated()), id: \.offset) { index, token in
                        let id = tokenIds[index]
                        VStack(alignment: .leading, spacing: 10) {
                            // System-rendered name + icon (not exportable to WebView).
                            Label(token)
                                .labelStyle(.titleAndIcon)

                            TextField(
                                "Nickname in RepLock (required)",
                                text: Binding(
                                    get: { displayNames[id] ?? "" },
                                    set: { displayNames[id] = $0 }
                                )
                            )
                            .textInputAutocapitalization(.words)
                            .autocorrectionDisabled()
                        }
                        .padding(.vertical, 4)
                    }
                }

                if !tokens.isEmpty && !allNamesFilled {
                    Section {
                        Text("Enter a nickname for each app to continue.")
                            .font(.footnote)
                            .foregroundStyle(.orange)
                            .listRowBackground(Color.clear)
                    }
                }
            }
            .navigationTitle("Confirm apps")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Back", action: onCancel)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        onConfirm(trimmedNames())
                    }
                    .fontWeight(.semibold)
                    .disabled(!allNamesFilled)
                }
            }
        }
    }

    private func trimmedNames() -> [String: String] {
        var cleaned: [String: String] = [:]
        for id in tokenIds {
            let value = (displayNames[id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            if !value.isEmpty { cleaned[id] = value }
        }
        return cleaned
    }
}

/// Read-only / rename sheet for previously selected tokens (Apps tab).
@available(iOS 16.0, *)
struct RepLockSelectedAppsReviewView: View {
    let tokens: [ApplicationToken]
    let tokenIds: [String]
    @State private var displayNames: [String: String]
    let onSave: ([String: String]) -> Void
    let onDismiss: () -> Void

    init(
        tokens: [ApplicationToken],
        tokenIds: [String],
        initialNames: [String: String],
        onSave: @escaping ([String: String]) -> Void,
        onDismiss: @escaping () -> Void
    ) {
        self.tokens = tokens
        self.tokenIds = tokenIds
        self._displayNames = State(initialValue: initialNames)
        self.onSave = onSave
        self.onDismiss = onDismiss
    }

    private var allNamesFilled: Bool {
        guard !tokens.isEmpty else { return true }
        return tokenIds.allSatisfy { id in
            (displayNames[id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if tokens.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "app.dashed")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                        Text("No apps selected")
                            .font(.headline)
                        Text("Use Choose apps to pick distractions with Apple’s Screen Time picker.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        Section {
                            Text(
                                "Icons and titles below are rendered by iOS. Nicknames are required so apps appear by name in the RepLock Apps list."
                            )
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .listRowBackground(Color.clear)
                        }

                        Section("Blocked selection") {
                            ForEach(Array(tokens.enumerated()), id: \.offset) { index, token in
                                let id = tokenIds[index]
                                VStack(alignment: .leading, spacing: 10) {
                                    Label(token)
                                        .labelStyle(.titleAndIcon)
                                    TextField(
                                        "Nickname in RepLock (required)",
                                        text: Binding(
                                            get: { displayNames[id] ?? "" },
                                            set: { displayNames[id] = $0 }
                                        )
                                    )
                                    .textInputAutocapitalization(.words)
                                    .autocorrectionDisabled()
                                }
                                .padding(.vertical, 4)
                            }
                        }

                        if !allNamesFilled {
                            Section {
                                Text("Enter a nickname for each app to save.")
                                    .font(.footnote)
                                    .foregroundStyle(.orange)
                                    .listRowBackground(Color.clear)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Screen Time apps")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close", action: onDismiss)
                }
                if !tokens.isEmpty {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Save") {
                            onSave(trimmedNames())
                        }
                        .fontWeight(.semibold)
                        .disabled(!allNamesFilled)
                    }
                }
            }
        }
    }

    private func trimmedNames() -> [String: String] {
        var cleaned: [String: String] = [:]
        for id in tokenIds {
            let value = (displayNames[id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            if !value.isEmpty { cleaned[id] = value }
        }
        return cleaned
    }
}

// MARK: - Presenter

@available(iOS 16.0, *)
final class ActivityPickerPresenter {
    static let shared = ActivityPickerPresenter()

    private var hostingController: UIViewController?

    /// Presents FamilyActivityPicker, then a confirmation sheet with `Label(token)`.
    func present(
        from presenter: UIViewController?,
        initialSelection: FamilyActivitySelection,
        onComplete: @escaping (FamilyActivitySelection, [String: String]) -> Void
    ) {
        guard let presenter else { return }

        var selection = initialSelection
        let store = SelectionStore.shared

        let root = RepLockActivityPickerView(
            selection: Binding(
                get: { selection },
                set: { selection = $0 }
            ),
            onDone: { [weak self] in
                self?.dismiss {
                    self?.presentConfirmation(
                        from: presenter,
                        selection: selection,
                        initialNames: store.loadDisplayNames(),
                        onConfirm: { names in
                            onComplete(selection, names)
                        },
                        onCancel: {
                            // Discard picker changes — keep prior selection.
                            onComplete(initialSelection, store.loadDisplayNames())
                        }
                    )
                }
            },
            onCancel: { [weak self] in
                self?.dismiss {
                    onComplete(initialSelection, store.loadDisplayNames())
                }
            }
        )

        let host = UIHostingController(rootView: root)
        host.modalPresentationStyle = .pageSheet
        hostingController = host
        presenter.present(host, animated: true)
    }

    func presentReview(
        from presenter: UIViewController?,
        selection: FamilyActivitySelection,
        onComplete: @escaping ([String: String]) -> Void
    ) {
        guard let presenter else { return }

        let store = SelectionStore.shared
        let tokens = Array(selection.applicationTokens)
        let tokenIds = tokens.map { store.stableTokenId(for: $0) ?? UUID().uuidString }

        let root = RepLockSelectedAppsReviewView(
            tokens: tokens,
            tokenIds: tokenIds,
            initialNames: store.loadDisplayNames(),
            onSave: { [weak self] names in
                self?.dismiss {
                    onComplete(names)
                }
            },
            onDismiss: { [weak self] in
                self?.dismiss {
                    onComplete(store.loadDisplayNames())
                }
            }
        )

        let host = UIHostingController(rootView: root)
        host.modalPresentationStyle = .pageSheet
        hostingController = host
        presenter.present(host, animated: true)
    }

    private func presentConfirmation(
        from presenter: UIViewController,
        selection: FamilyActivitySelection,
        initialNames: [String: String],
        onConfirm: @escaping ([String: String]) -> Void,
        onCancel: @escaping () -> Void
    ) {
        let store = SelectionStore.shared
        let tokens = Array(selection.applicationTokens)
        let tokenIds = tokens.map { store.stableTokenId(for: $0) ?? UUID().uuidString }

        let root = RepLockSelectedAppsConfirmView(
            tokens: tokens,
            tokenIds: tokenIds,
            initialNames: initialNames,
            onConfirm: { [weak self] names in
                self?.dismiss {
                    onConfirm(names)
                }
            },
            onCancel: { [weak self] in
                self?.dismiss {
                    onCancel()
                }
            }
        )

        let host = UIHostingController(rootView: root)
        host.modalPresentationStyle = .pageSheet
        hostingController = host
        presenter.present(host, animated: true)
    }

    private func dismiss(completion: @escaping () -> Void) {
        hostingController?.dismiss(animated: true) { [weak self] in
            self?.hostingController = nil
            completion()
        }
    }
}
