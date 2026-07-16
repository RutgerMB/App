import Foundation
import Capacitor
import PurchasesHybridCommon

public extension PurchasesPlugin {

    @objc func setAttributes(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        let attributes = call.jsObjectRepresentation
        if attributes.isEmpty {
            call.resolve()
            return
        }
        CommonFunctionality.setAttributes(attributes)
        call.resolve()
    }

    @objc func setEmail(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setEmail(call.optionalString("email"))
        call.resolve()
    }

    @objc func setPhoneNumber(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setPhoneNumber(call.optionalString("phoneNumber"))
        call.resolve()
    }

    @objc func setDisplayName(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setDisplayName(call.optionalString("displayName"))
        call.resolve()
    }

    @objc func setPushToken(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setPushToken(call.optionalString("pushToken"))
        call.resolve()
    }

    @objc func setAdjustID(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setAdjustID(call.optionalString("adjustID"))
        call.resolve()
    }

    @objc func setAppsflyerID(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setAppsflyerID(call.optionalString("appsflyerID"))
        call.resolve()
    }

    @objc func setFBAnonymousID(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setFBAnonymousID(call.optionalString("fbAnonymousID"))
        call.resolve()
    }

    @objc func setMparticleID(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setMparticleID(call.optionalString("mparticleID"))
        call.resolve()
    }

    @objc func setCleverTapID(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setCleverTapID(call.optionalString("cleverTapID"))
        call.resolve()
    }

    @objc func setMixpanelDistinctID(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setMixpanelDistinctID(call.optionalString("mixpanelDistinctID"))
        call.resolve()
    }

    @objc func setFirebaseAppInstanceID(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setFirebaseAppInstanceID(call.optionalString("firebaseAppInstanceID"))
        call.resolve()
    }

    @objc func setOnesignalID(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setOnesignalID(call.optionalString("onesignalID"))
        call.resolve()
    }

    @objc func setOnesignalUserID(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setOnesignalUserID(call.optionalString("onesignalUserID"))
        call.resolve()
    }

    @objc func setAirshipChannelID(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setAirshipChannelID(call.optionalString("airshipChannelID"))
        call.resolve()
    }

    @objc func setMediaSource(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setMediaSource(call.optionalString("mediaSource"))
        call.resolve()
    }

    @objc func setCampaign(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setCampaign(call.optionalString("campaign"))
        call.resolve()
    }

    @objc func setAdGroup(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setAdGroup(call.optionalString("adGroup"))
        call.resolve()
    }

    @objc func setAd(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setAd(call.optionalString("ad"))
        call.resolve()
    }

    @objc func setKeyword(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setKeyword(call.optionalString("keyword"))
        call.resolve()
    }

    @objc func setCreative(_ call: CAPPluginCall) {
        guard self.rejectIfPurchasesNotConfigured(call) else { return }
        CommonFunctionality.setCreative(call.optionalString("creative"))
        call.resolve()
    }
}
