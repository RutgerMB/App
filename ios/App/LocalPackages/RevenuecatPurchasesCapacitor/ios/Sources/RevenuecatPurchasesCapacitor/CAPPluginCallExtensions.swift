import Foundation
import Capacitor

internal extension CAPPluginCall {

    func optionalString(_ key: String) -> String? {
        let value = getString(key, "")
        return value.isEmpty ? nil : value
    }

    func optionalObject(_ key: String) -> JSObject? {
        return jsObjectRepresentation[key] as? JSObject
    }

    func optionalArray(_ key: String) -> JSArray? {
        return jsObjectRepresentation[key] as? JSArray
    }

    func getOrRejectString(_ parameterName: String) -> String? {
        let parameter = getString(parameterName, "")
        guard !parameter.isEmpty else {
            rcReject(self, "Must provide \(parameterName) parameter")
            return nil
        }
        return parameter
    }

    func getOrRejectBool(_ parameterName: String) -> Bool? {
        guard jsObjectRepresentation[parameterName] != nil else {
            rcReject(self, "Must provide \(parameterName) parameter")
            return nil
        }
        return getBool(parameterName, false)
    }

    func getOrRejectStringArray(_ parameterName: String) -> [String]? {
        guard let parameter = getArray(parameterName, []) as? [String],
              jsObjectRepresentation[parameterName] != nil else {
            rcReject(self, "Must provide \(parameterName) parameter")
            return nil
        }
        return parameter
    }

    func getOrRejectObject(_ parameterName: String) -> JSObject? {
        guard let parameter = optionalObject(parameterName) else {
            rcReject(self, "Must provide \(parameterName) parameter")
            return nil
        }
        return parameter
    }
}
