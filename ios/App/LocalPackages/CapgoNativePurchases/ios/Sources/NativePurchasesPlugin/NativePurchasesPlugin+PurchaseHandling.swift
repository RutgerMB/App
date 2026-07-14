import Capacitor
import StoreKit

extension NativePurchasesPlugin {
    @MainActor
    func handlePurchaseResult(
        _ result: Product.PurchaseResult,
        call: CAPPluginCall,
        autoFinish: Bool
    ) async {
        switch result {
        case let .success(verificationResult):
            switch verificationResult {
            case .verified(let transaction):
                let response = await TransactionHelpers.buildTransactionResponse(
                    from: transaction,
                    jwsRepresentation: verificationResult.jwsRepresentation
                )
                if autoFinish {
                    print("Auto-finishing verified transaction")
                    await transaction.finish()
                } else {
                    print("Manual finish required for verified transaction")
                }
                call.resolve(response)
            case .unverified(_, let error):
                capgoReject(call,error.localizedDescription)
            }
        case .pending:
            capgoReject(call,"Transaction pending")
        case .userCancelled:
            capgoReject(call,"User cancelled")
        @unknown default:
            capgoReject(call,"Unknown error")
        }
    }
}
