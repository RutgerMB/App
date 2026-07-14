// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "RepLockRevenueCat",
    platforms: [.iOS(.v16)],
    products: [
        .library(
            name: "RepLockRevenueCat",
            targets: ["RepLockRevenueCatPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.4.1"),
        .package(url: "https://github.com/RevenueCat/purchases-ios-spm.git", from: "5.27.1"),
        .package(name: "RepLockControls", path: "../RepLockControls")
    ],
    targets: [
        .target(
            name: "RepLockRevenueCatPlugin",
            dependencies: [
                .product(name: "RepLockPluginBridge", package: "RepLockControls"),
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "RevenueCat", package: "purchases-ios-spm"),
                .product(name: "RevenueCatUI", package: "purchases-ios-spm")
            ],
            path: "ios/Sources/RepLockRevenueCatPlugin")
    ]
)
