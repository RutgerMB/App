// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "RepLockControls",
    platforms: [.iOS(.v16)],
    products: [
        .library(
            name: "RepLockControls",
            targets: ["RepLockControlsPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "RepLockControlsPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/RepLockControlsPlugin",
            linkerSettings: [
                .linkedFramework("FamilyControls"),
                .linkedFramework("ManagedSettings"),
                .linkedFramework("DeviceActivity")
            ])
    ]
)
