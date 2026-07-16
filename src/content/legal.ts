import type { Locale } from '@/i18n/types'

export type LegalSection = { title: string; paragraphs: string[] }

export type LegalDocument = {
  privacyIntro: string
  privacySections: LegalSection[]
  termsIntro: string
  termsSections: LegalSection[]
  lastUpdated: string
}

const SUPPORT_EMAIL = 'RepLockIssue@outlook.com'

const legalEn: LegalDocument = {
  lastUpdated: 'July 16, 2026',
  privacyIntro:
    'This Privacy Policy describes how RepLock ("we", "us", "our") collects, uses, stores, and protects personal data when you use the RepLock mobile application on iOS and Android and related services (the "Service"). By using the Service, you agree to this policy. If you do not agree, please do not use the Service. The live web version is at https://rutgermb.github.io/App/legal/privacy.html.',
  privacySections: [
    {
      title: '1. Who we are',
      paragraphs: [
        'RepLock is the data controller for personal data processed through the Service, except where we use third-party processors listed below.',
        'For privacy questions, support, or to exercise your rights, contact us at ' + SUPPORT_EMAIL + '.',
      ],
    },
    {
      title: '2. Information we collect',
      paragraphs: [
        'Account data: name, email address, and authentication credentials when you register or sign in (via Firebase Authentication).',
        'Workout and progress data: exercises completed, amounts/reps, streaks, earned screen-time balance, difficulty settings, and in-app preferences.',
        'Blocking configuration: apps you choose to limit, nicknames/display names you assign, daily opening limits, schedules, unlock usage history, and related settings. On Android, package names may be stored to enforce limits.',
        'Subscription data: plan type, trial status, and transaction/entitlement identifiers from Apple In-App Purchase, Google Play Billing, and/or RevenueCat. We do not store full payment card numbers.',
        'Technical data: device type, operating system, app version, language, and crash or error diagnostics.',
        'Communications: messages you send to support.',
        'We do not currently use Firebase Analytics or similar advertising analytics SDKs to build marketing profiles. If that changes, we will update this policy first.',
      ],
    },
    {
      title: '3. App blocking, Screen Time & device data',
      paragraphs: [
        'On Android, with permissions you enable (such as Accessibility and/or Usage Access), RepLock can block selected apps and, where permitted, read device usage statistics for apps you track. Enforcement data stays on your device where possible; we store configuration needed to sync your account.',
        'On iOS, RepLock uses Apple Family Controls / Screen Time APIs (Managed Settings, Device Activity, and related frameworks) that you authorize. Apple presents system UI for selecting apps to shield. Apple restricts what third-party apps can read: we generally cannot obtain the real App Store name or icon of shielded apps for our web UI. You may assign a nickname. Nicknames and selection tokens may be stored on-device (including in an App Group shared with RepLock extensions) and synced with your account configuration as needed.',
        'We do not read your passwords, messages, photos, or the full contents of other apps. We do not sell personal data or use blocking data for advertising profiles. Blocking depends on OS permissions and platform rules; we do not claim it works in every edge case.',
      ],
    },
    {
      title: '4. Push notifications',
      paragraphs: [
        'If you allow notifications, the OS may grant RepLock permission to send push or local notifications (for example workout reminders or trial-related notices when those features are enabled). You can change this in system Settings or in the app. Token registration may use APNs or Google services. Reminder content may roll out over time; granting permission does not mean every reminder type is already active.',
      ],
    },
    {
      title: '5. How we use your data',
      paragraphs: [
        'To provide and operate the Service, including earning screen time through workouts and enforcing limits you configure.',
        'To sync progress and settings across devices when you sign in.',
        'To process subscriptions, free trials, restores, and entitlement checks (including via RevenueCat).',
        'To send service-related messages if you enable notifications.',
        'To improve reliability, fix bugs, and understand aggregated product usage.',
        'To comply with legal obligations and protect our rights and users\' safety.',
      ],
    },
    {
      title: '6. Legal bases (EEA/UK)',
      paragraphs: [
        'We process data based on: (a) performance of our contract with you; (b) your consent where required (e.g. optional notifications or certain device permissions); (c) legitimate interests such as security and product improvement; and (d) legal obligations.',
        'You may withdraw consent at any time without affecting the lawfulness of processing before withdrawal.',
      ],
    },
    {
      title: '7. Sharing with third parties',
      paragraphs: [
        'We share data only as needed with trusted service providers, including:',
        '• Firebase (Google) — Authentication and Firestore (or similar) cloud sync. We do not currently enable Firebase Analytics for advertising.',
        '• Apple — In-App Purchases, App Store subscriptions, Screen Time / Family Controls, and APNs where applicable.',
        '• Google — Google Play Billing on Android and related mobile services you enable.',
        '• RevenueCat — subscription status, receipt validation, and entitlement syncing on mobile.',
        '• Hosting and infrastructure providers (including GitHub Pages for public legal/support pages).',
        'Providers process data under their own privacy policies and our instructions. We may disclose data if required by law or to protect safety and rights.',
      ],
    },
    {
      title: '8. Retention',
      paragraphs: [
        'We keep account and workout data while your account is active. After you delete your account, we delete or anonymize personal data within a reasonable period, except where we must retain data for legal, tax, or dispute-resolution purposes.',
        'Backup copies may persist for a limited time. On-device App Group / Screen Time configuration may remain until you revoke permissions or uninstall the app.',
      ],
    },
    {
      title: '9. Security',
      paragraphs: [
        'We use technical and organizational measures to protect personal data, including encryption in transit, access controls, and secure authentication.',
        'No method of transmission or storage is 100% secure. Keep your login credentials confidential.',
      ],
    },
    {
      title: '10. Log & diagnostic data',
      paragraphs: [
        'If the app crashes or errors occur, we may collect diagnostic information (device model, OS version, app version, error timestamps). This data is used to improve stability and is not used to identify you beyond your account when you are signed in.',
      ],
    },
    {
      title: '11. Your rights',
      paragraphs: [
        'Depending on your location, you may have the right to access, correct, delete, restrict, or port your personal data, and to object to certain processing.',
        'You can delete your account in Settings → Delete account. You may also contact ' + SUPPORT_EMAIL + '.',
        'EEA/UK users may lodge a complaint with their local data protection authority.',
      ],
    },
    {
      title: '12. Children',
      paragraphs: [
        'The Service is not directed at children under 13 (or the minimum age in your country). We do not knowingly collect data from children. Contact us if you believe a child has provided personal data.',
      ],
    },
    {
      title: '13. International transfers',
      paragraphs: [
        'Your data may be processed in countries outside your own (including by Firebase, Apple, Google, or RevenueCat). Where required, we use appropriate safeguards such as standard contractual clauses approved by the European Commission.',
      ],
    },
    {
      title: '14. Changes to this policy',
      paragraphs: [
        'We may update this Privacy Policy from time to time. We will post the new version in the app and at https://rutgermb.github.io/App/legal/privacy.html and update the "Last updated" date. Material changes may require renewed consent where applicable.',
      ],
    },
  ],
  termsIntro:
    'Please read these Terms of Service ("Terms") carefully before using RepLock. Your access to and use of the Service is conditioned on your acceptance of these Terms. The live web version is at https://rutgermb.github.io/App/legal/terms.html.',
  termsSections: [
    {
      title: '1. Acceptance',
      paragraphs: [
        'By accessing or using RepLock, you agree to be bound by these Terms and our Privacy Policy. If you disagree, you may not use the Service.',
        'You must be old enough to form a binding contract in your jurisdiction and comply with all applicable laws.',
      ],
    },
    {
      title: '2. The Service',
      paragraphs: [
        'RepLock helps you earn screen time through exercise and manage access to distracting apps according to rules you set. On iOS, blocking uses Apple Family Controls / Screen Time APIs you authorize. On Android, blocking may use Accessibility, Usage Access, and related permissions you enable.',
        'Features vary by platform, OS version, permissions, and subscription plan. We may modify, suspend, or discontinue features with reasonable notice where practicable.',
      ],
    },
    {
      title: '3. Subscriptions & In-App Purchases',
      paragraphs: [
        'RepLock Pro and related paid features are offered on a subscription basis through the Apple App Store and/or Google Play Store. Billing cycles and prices are shown at purchase. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel in your device subscription settings.',
        'We use RevenueCat (and Apple/Google billing) to validate purchases and sync entitlement status. Refunds are handled by Apple or Google according to their policies.',
      ],
    },
    {
      title: '4. Free trial',
      paragraphs: [
        'We may offer a free trial of Pro features. When the trial ends, your account may revert to the free tier unless you subscribe.',
        'We may change or end free trial offers at any time. Trial eligibility may be limited.',
      ],
    },
    {
      title: '5. App blocking & platform limits',
      paragraphs: [
        'You are responsible for granting and maintaining required permissions. We do not guarantee uninterrupted blocking. OS updates, revoked permissions, or platform policy changes may affect functionality.',
        'On iOS, Apple privacy rules may prevent RepLock from reading real app names into the in-app list; nicknames you enter are your responsibility.',
      ],
    },
    {
      title: '6. Acceptable use',
      paragraphs: [
        'Use RepLock only for personal wellbeing and lawful purposes.',
        'You may not reverse engineer the app (except where mandatory law allows), circumvent blocking or subscription limits, abuse trials, or use the Service to violate third-party rights.',
        'We may suspend or terminate accounts that violate these Terms.',
      ],
    },
    {
      title: '7. Health & fitness disclaimer',
      paragraphs: [
        'RepLock is not medical advice and does not replace professional healthcare. Consult a physician before starting any exercise program.',
        'You exercise at your own risk. We are not liable for injuries or health outcomes from workouts performed using the app.',
      ],
    },
    {
      title: '8. Intellectual property',
      paragraphs: [
        'RepLock, its logo, design, and content are owned by us or our licensors and protected by intellectual property laws. You receive a limited, non-exclusive, non-transferable license to use the app for personal use.',
        'You may not copy, modify, or distribute the Service without our written permission.',
      ],
    },
    {
      title: '9. Third-party services & links',
      paragraphs: [
        'The Service integrates third-party services including Apple, Google/Firebase, and RevenueCat. We are not responsible for their content or practices. Review their terms and privacy policies.',
      ],
    },
    {
      title: '10. Disclaimer of warranties',
      paragraphs: [
        'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
        'We do not warrant uninterrupted, error-free, or secure operation, or that blocking will work on every device or app.',
      ],
    },
    {
      title: '11. Limitation of liability',
      paragraphs: [
        'TO THE MAXIMUM EXTENT PERMITTED BY LAW, REPLOCK AND ITS AFFILIATES SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF PROFITS, DATA, OR GOODWILL.',
        'Our total liability for any claim relating to the Service shall not exceed the amount you paid us in the twelve months before the claim, or EUR 50 if you used the free plan.',
        'Some jurisdictions do not allow certain limitations; in those cases our liability is limited to the fullest extent permitted by law.',
      ],
    },
    {
      title: '12. Termination',
      paragraphs: [
        'You may stop using the Service and delete your account at any time in Settings. Deleting the app does not automatically cancel a store subscription — cancel in Apple or Google subscription settings.',
        'We may suspend or terminate access if you breach these Terms or if required for legal or security reasons.',
      ],
    },
    {
      title: '13. Governing law',
      paragraphs: [
        'These Terms are governed by the laws of the Netherlands, without regard to conflict-of-law rules, unless mandatory consumer protection laws in your country require otherwise.',
        'Disputes should first be raised with ' + SUPPORT_EMAIL + '. EU consumers may also use online dispute resolution platforms.',
      ],
    },
    {
      title: '14. Changes',
      paragraphs: [
        'We may update these Terms. Material changes will be communicated in the app or by email where appropriate. Continued use after changes take effect constitutes acceptance where permitted by law.',
      ],
    },
    {
      title: '15. Contact',
      paragraphs: ['Questions about these Terms: ' + SUPPORT_EMAIL + '. Support page: https://rutgermb.github.io/App/legal/support.html'],
    },
  ],
}

/** German, French, Spanish: full structure with localized text (fallback to English paragraphs where needed). */
const legalDe: LegalDocument = {
  ...legalEn,
  lastUpdated: 'Juli 2026',
  privacyIntro:
    'Diese Datenschutzerklärung beschreibt, wie RepLock personenbezogene Daten erhebt, nutzt und schützt, wenn du die RepLock-App und zugehörige Dienste („Dienst") nutzt.',
  termsIntro:
    'Bitte lies diese Nutzungsbedingungen („Bedingungen") sorgfältig, bevor du RepLock verwendest.',
  privacySections: legalEn.privacySections.map((s, i) => ({
    ...s,
    title: [
      '1. Wer wir sind',
      '2. Welche Daten wir erheben',
      '3. App-Blockierung, Screen Time & Gerätedaten',
      '4. Push-Benachrichtigungen',
      '5. Wie wir Daten nutzen',
      '6. Rechtsgrundlagen (EWR/VK)',
      '7. Weitergabe an Dritte',
      '8. Aufbewahrung',
      '9. Sicherheit',
      '10. Protokoll- & Diagnosedaten',
      '11. Deine Rechte',
      '12. Kinder',
      '13. Internationale Übermittlung',
      '14. Änderungen',
    ][i] ?? s.title,
  })),
  termsSections: legalEn.termsSections.map((s, i) => ({
    ...s,
    title: [
      '1. Annahme',
      '2. Der Dienst',
      '3. Abonnements & In-App-Käufe',
      '4. Kostenlose Testphase',
      '5. App-Blockierung & Plattformlimits',
      '6. Zulässige Nutzung',
      '7. Gesundheit & Fitness',
      '8. Geistiges Eigentum',
      '9. Dienste Dritter',
      '10. Haftungsausschluss',
      '11. Haftungsbeschränkung',
      '12. Kündigung',
      '13. Anwendbares Recht',
      '14. Änderungen',
      '15. Kontakt',
    ][i] ?? s.title,
  })),
}

const legalFr: LegalDocument = {
  ...legalEn,
  lastUpdated: 'juillet 2026',
  privacyIntro:
    'Cette politique de confidentialité décrit comment RepLock collecte, utilise et protège les données personnelles lorsque tu utilises l\'application RepLock et les services associés (le « Service »).',
  termsIntro:
    'Lis attentivement ces Conditions d\'utilisation (« Conditions ») avant d\'utiliser RepLock.',
  privacySections: legalEn.privacySections.map((s, i) => ({
    ...s,
    title: [
      '1. Qui nous sommes',
      '2. Données collectées',
      '3. Blocage d\'apps, Screen Time & données appareil',
      '4. Notifications push',
      '5. Utilisation des données',
      '6. Bases légales (EEE/RU)',
      '7. Partage avec des tiers',
      '8. Conservation',
      '9. Sécurité',
      '10. Journaux & diagnostics',
      '11. Tes droits',
      '12. Enfants',
      '13. Transferts internationaux',
      '14. Modifications',
    ][i] ?? s.title,
  })),
  termsSections: legalEn.termsSections.map((s, i) => ({
    ...s,
    title: [
      '1. Acceptation',
      '2. Le Service',
      '3. Abonnements & achats in-app',
      '4. Essai gratuit',
      '5. Blocage d\'apps & limites plateforme',
      '6. Utilisation acceptable',
      '7. Santé & fitness',
      '8. Propriété intellectuelle',
      '9. Services tiers',
      '10. Exclusion de garanties',
      '11. Limitation de responsabilité',
      '12. Résiliation',
      '13. Droit applicable',
      '14. Modifications',
      '15. Contact',
    ][i] ?? s.title,
  })),
}

const legalEs: LegalDocument = {
  ...legalEn,
  lastUpdated: 'julio de 2026',
  privacyIntro:
    'Esta Política de privacidad describe cómo RepLock recopila, usa y protege los datos personales cuando utilizas la aplicación RepLock y los servicios relacionados (el «Servicio»).',
  termsIntro:
    'Lee estos Términos de servicio («Términos») con atención antes de usar RepLock.',
  privacySections: legalEn.privacySections.map((s, i) => ({
    ...s,
    title: [
      '1. Quiénes somos',
      '2. Datos que recopilamos',
      '3. Bloqueo de apps, Screen Time y datos del dispositivo',
      '4. Notificaciones push',
      '5. Cómo usamos los datos',
      '6. Bases legales (EEE/RU)',
      '7. Compartir con terceros',
      '8. Conservación',
      '9. Seguridad',
      '10. Registros y diagnósticos',
      '11. Tus derechos',
      '12. Menores',
      '13. Transferencias internacionales',
      '14. Cambios',
    ][i] ?? s.title,
  })),
  termsSections: legalEn.termsSections.map((s, i) => ({
    ...s,
    title: [
      '1. Aceptación',
      '2. El Servicio',
      '3. Suscripciones y compras in-app',
      '4. Prueba gratuita',
      '5. Bloqueo de apps y límites de plataforma',
      '6. Uso aceptable',
      '7. Salud y fitness',
      '8. Propiedad intelectual',
      '9. Servicios de terceros',
      '10. Exención de garantías',
      '11. Limitación de responsabilidad',
      '12. Terminación',
      '13. Ley aplicable',
      '14. Cambios',
      '15. Contacto',
    ][i] ?? s.title,
  })),
}

const documents: Record<Locale, LegalDocument> = {
  en: legalEn,
  nl: {
    ...legalEn,
    lastUpdated: '16 juli 2026',
  },
  de: legalDe,
  fr: legalFr,
  es: legalEs,
}

export function getLegalDocument(locale: Locale): LegalDocument {
  return documents[locale] ?? documents.en
}
