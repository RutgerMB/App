//
//  ShieldConfigurationExtension.swift
//  RepLockShieldConfiguration
//
//  Customizes the system shield shown when a blocked app is opened.
//  Bundle ID: app.replock.bleeker.RepLockShieldConfiguration
//

import ManagedSettings
import ManagedSettingsUI
import UIKit

final class ShieldConfigurationExtension: ShieldConfigurationDataSource {
    private let brandGreen = UIColor(red: 0.11, green: 0.54, blue: 0.37, alpha: 1) // #1B8A5E
    private let ink = UIColor(white: 0.08, alpha: 1)
    private let muted = UIColor(white: 0.35, alpha: 1)

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        makeConfiguration()
    }

    private func makeConfiguration() -> ShieldConfiguration {
        // Prefer bundled AppIcon-sized asset named "ShieldLogo"; falls back to SF Symbol.
        let icon =
            UIImage(named: "ShieldLogo")
            ?? UIImage(systemName: "lock.shield.fill")

        return ShieldConfiguration(
            backgroundBlurStyle: .systemThickMaterialDark,
            backgroundColor: UIColor(red: 0.06, green: 0.09, blue: 0.08, alpha: 1),
            icon: icon,
            title: ShieldConfiguration.Label(
                text: "RepLock",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "This app is locked. Earn screen time with a quick workout in RepLock.",
                color: muted
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Earn minutes",
                color: .white
            ),
            primaryButtonBackgroundColor: brandGreen,
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Close",
                color: muted
            )
        )
    }
}
