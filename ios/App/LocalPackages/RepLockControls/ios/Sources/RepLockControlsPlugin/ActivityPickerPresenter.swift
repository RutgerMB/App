import UIKit
import SwiftUI
import FamilyControls

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

@available(iOS 16.0, *)
final class ActivityPickerPresenter {
    static let shared = ActivityPickerPresenter()

    private var hostingController: UIViewController?

    func present(
        from presenter: UIViewController?,
        initialSelection: FamilyActivitySelection,
        onComplete: @escaping (FamilyActivitySelection) -> Void
    ) {
        guard let presenter else { return }

        var selection = initialSelection

        let root = RepLockActivityPickerView(
            selection: Binding(
                get: { selection },
                set: { selection = $0 }
            ),
            onDone: { [weak self] in
                self?.dismiss {
                    onComplete(selection)
                }
            },
            onCancel: { [weak self] in
                self?.dismiss {
                    onComplete(selection)
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
