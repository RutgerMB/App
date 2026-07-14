// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v16)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(name: "RepLockControls", path: "../LocalPackages/RepLockControls"),
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.4.1"),
        .package(name: "CapgoNativePurchases", path: "../LocalPackages/CapgoNativePurchases"),
        .package(name: "RepLockRevenueCat", path: "../LocalPackages/RepLockRevenueCat")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "RepLockControls", package: "RepLockControls"),
                .product(name: "CapgoNativePurchases", package: "CapgoNativePurchases"),
                .product(name: "RepLockRevenueCat", package: "RepLockRevenueCat")
            ]
        )
    ]
)
