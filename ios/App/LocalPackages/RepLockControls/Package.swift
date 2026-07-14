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
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.4.1")
    ],
    targets: [
        .target(
            name: "RepLockPluginBridge",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/RepLockPluginBridge",
            publicHeadersPath: "."
        ),
        .target(
            name: "RepLockControlsPlugin",
            dependencies: [
                "RepLockPluginBridge",
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
