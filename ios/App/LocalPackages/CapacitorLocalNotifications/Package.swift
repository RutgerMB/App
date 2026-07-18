// swift-tools-version: 5.9
import PackageDescription

// Vendored from @capacitor/local-notifications with Xcode 15.4 + Capacitor 8 SPM patches:
// - reject via RepLockPluginBridge (CAPPluginCall.reject is hidden)
// - avoid PluginConfig.getArray / JSTypes.coerceDictionaryToJSObject
// - makeAttachmentUrl without CAPBridgeProtocol.localURL (missing on Cap 8 SPM)
let package = Package(
    name: "CapacitorLocalNotifications",
    platforms: [.iOS(.v16)],
    products: [
        .library(
            name: "CapacitorLocalNotifications",
            targets: ["LocalNotificationsPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.4.1"),
        .package(name: "RepLockControls", path: "../RepLockControls")
    ],
    targets: [
        .target(
            name: "LocalNotificationsPlugin",
            dependencies: [
                .product(name: "RepLockPluginBridge", package: "RepLockControls"),
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/LocalNotificationsPlugin")
    ]
)
