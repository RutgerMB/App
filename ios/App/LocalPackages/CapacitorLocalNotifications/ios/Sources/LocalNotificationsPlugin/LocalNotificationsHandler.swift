import Capacitor
import UserNotifications

public class LocalNotificationsHandler: NSObject, NotificationHandlerProtocol {

    public weak var plugin: CAPPlugin?

    // Local list of notification id -> JSObject for storing options
    // between notification requests
    var notificationRequestLookup = [String: JSObject]()

    public func requestPermissions(with completion: ((Bool, Error?) -> Void)? = nil) {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.badge, .alert, .sound]) { (granted, error) in
            completion?(granted, error)
        }
    }

    public func checkPermissions(with completion: ((UNAuthorizationStatus) -> Void)? = nil) {
        let center = UNUserNotificationCenter.current()
        center.getNotificationSettings { settings in
            completion?(settings.authorizationStatus)
        }
    }

    public func willPresent(notification: UNNotification) -> UNNotificationPresentationOptions {
        let notificationData = makeNotificationRequestJSObject(notification.request)

        self.plugin?.notifyListeners("localNotificationReceived", data: notificationData)

        if let options = notificationRequestLookup[notification.request.identifier] {
            let silent = options["silent"] as? Bool ?? false
            if silent {
                return UNNotificationPresentationOptions.init(rawValue: 0)
            }
        }

        // Avoid PluginConfig.getArray — hidden on Xcode 15.4 + Capacitor 8 SPM.
        // Match upstream default when presentationOptions is unset.
        return [
            .badge,
            .sound,
            .banner,
            .list
        ]
    }

    public func didReceive(response: UNNotificationResponse) {
        var data = JSObject()

        let originalNotificationRequest = response.notification.request
        let actionId = response.actionIdentifier

        if actionId == UNNotificationDefaultActionIdentifier {
            data["actionId"] = "tap"
        } else if actionId == UNNotificationDismissActionIdentifier {
            data["actionId"] = "dismiss"
        } else {
            data["actionId"] = actionId
        }

        if let inputType = response as? UNTextInputNotificationResponse {
            data["inputValue"] = inputType.userText
        }

        data["notification"] = makeNotificationRequestJSObject(originalNotificationRequest)

        self.plugin?.notifyListeners("localNotificationActionPerformed", data: data, retainUntilConsumed: true)
    }

    func makeNotificationRequestJSObject(_ request: UNNotificationRequest) -> JSObject {
        let notificationRequest = notificationRequestLookup[request.identifier] ?? [:]
        var notification = makePendingNotificationRequestJSObject(request)
        notification["sound"] = notificationRequest["sound"] ?? ""
        notification["actionTypeId"] = request.content.categoryIdentifier
        notification["attachments"] = notificationRequest["attachments"] ?? []
        return notification
    }

    func makePendingNotificationRequestJSObject(_ request: UNNotificationRequest) -> JSObject {
        var notification: JSObject = [
            "id": Int(request.identifier) ?? -1,
            "title": request.content.title,
            "body": request.content.body
        ]

        // Avoid JSTypes.coerceDictionaryToJSObject — missing on Xcode 15.4 + Capacitor 8 SPM.
        if let userInfo = coerceDictionaryToJSObject(request.content.userInfo) {
            var extra = userInfo["cap_extra"] as? JSObject ?? userInfo

            for (key, value) in extra {
                if let date = value as? Date {
                    extra[key] = ISO8601DateFormatter().string(from: date)
                }
            }

            notification["extra"] = extra

            if var schedule = userInfo["cap_schedule"] as? JSObject {
                if let date = schedule["at"] as? Date {
                    schedule["at"] = ISO8601DateFormatter().string(from: date)
                }
                notification["schedule"] = schedule
            }
        }

        return notification
    }

    /// Local stand-in for JSTypes.coerceDictionaryToJSObject (unavailable on Xcode 15.4 Cap 8 SPM).
    private func coerceDictionaryToJSObject(_ dict: [AnyHashable: Any]) -> JSObject? {
        var out = JSObject()
        for (key, value) in dict {
            guard let stringKey = key as? String else { continue }
            if let jsValue = coerceJSValue(value) {
                out[stringKey] = jsValue
            }
        }
        return out
    }

    private func coerceJSValue(_ value: Any) -> JSValue? {
        switch value {
        case let s as String:
            return s
        case let b as Bool:
            return b
        case let i as Int:
            return i
        case let i as Int64:
            return Int(i)
        case let d as Double:
            return d
        case let f as Float:
            return Double(f)
        case let n as NSNumber:
            // Distinguish bool-backed NSNumber from numeric.
            if CFGetTypeID(n) == CFBooleanGetTypeID() {
                return n.boolValue
            }
            if CFNumberIsFloatType(n) {
                return n.doubleValue
            }
            return n.intValue
        case let date as Date:
            return date
        case let dict as [AnyHashable: Any]:
            return coerceDictionaryToJSObject(dict)
        case let dict as [String: Any]:
            return coerceDictionaryToJSObject(dict)
        case let arr as [Any]:
            return arr.compactMap { coerceJSValue($0) }
        case is NSNull:
            return NSNull()
        default:
            return String(describing: value)
        }
    }
}
