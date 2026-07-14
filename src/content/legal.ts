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
  lastUpdated: 'July 2026',
  privacyIntro:
    'This Privacy Policy describes how RepLock ("we", "us", "our") collects, uses, stores, and protects personal data when you use the RepLock mobile application and related services (the "Service"). By using the Service, you agree to this policy. If you do not agree, please do not use the Service.',
  privacySections: [
    {
      title: '1. Who we are',
      paragraphs: [
        'RepLock is the data controller for personal data processed through the Service, except where we use third-party processors listed below.',
        'For privacy questions or to exercise your rights, contact us at ' + SUPPORT_EMAIL + '.',
      ],
    },
    {
      title: '2. Information we collect',
      paragraphs: [
        'Account data: name, email address, and securely hashed password when you register.',
        'Workout and usage data: exercises completed, reps, streaks, earned screen-time balance, difficulty settings, and in-app preferences.',
        'Blocking settings: apps you choose to limit, daily opening limits, schedules, and related configuration. On Android, blocked app identifiers (package names) are stored to enforce limits on your device.',
        'Subscription data: plan type, trial status, and transaction identifiers from Apple In-App Purchase or Stripe (web/Android where applicable). We do not store full payment card numbers.',
        'Technical data: device type, operating system, app version, language, and anonymized crash or error logs to improve reliability.',
        'Communications: messages you send to support.',
      ],
    },
    {
      title: '3. App blocking & device data',
      paragraphs: [
        'On Android, RepLock may use system accessibility or related APIs you explicitly enable to block selected apps. Blocked app choices and enforcement data stay on your device where possible; we only store configuration needed to sync your account.',
        'On iOS, Apple does not allow third-party apps to list or block other installed apps in the same way. RepLock tracks limits inside the app and will use Apple-approved APIs (such as Screen Time / Family Controls) when available. We cannot read your full list of installed apps on iOS.',
        'We do not sell your personal data or use blocking data for advertising profiles.',
      ],
    },
    {
      title: '4. How we use your data',
      paragraphs: [
        'To provide and operate the Service, including earning screen time through workouts and enforcing limits you configure.',
        'To sync your progress across devices when you sign in.',
        'To process subscriptions and free trials.',
        'To send service-related messages (e.g. workout reminders or trial expiry) if you enable notifications.',
        'To improve the Service, fix bugs, and understand aggregated usage patterns.',
        'To comply with legal obligations and protect our rights.',
      ],
    },
    {
      title: '5. Legal bases (EEA/UK)',
      paragraphs: [
        'We process data based on: (a) performance of our contract with you; (b) your consent where required (e.g. optional marketing or notifications); (c) legitimate interests such as security and product improvement; and (d) legal obligations.',
        'You may withdraw consent at any time without affecting the lawfulness of processing before withdrawal.',
      ],
    },
    {
      title: '6. Sharing with third parties',
      paragraphs: [
        'We share data only as needed with trusted service providers, including:',
        '• Firebase (Google) — authentication and cloud database sync.',
        '• Apple — In-App Purchases and App Store subscription management on iOS.',
        '• Stripe — payment processing on web/Android where enabled.',
        '• Hosting and infrastructure providers that help us run the Service.',
        'Providers process data under their own privacy policies and our instructions. We may disclose data if required by law or to protect safety and rights.',
      ],
    },
    {
      title: '7. Retention',
      paragraphs: [
        'We keep account and workout data while your account is active. After you delete your account, we delete or anonymize personal data within a reasonable period, except where we must retain data for legal, tax, or dispute-resolution purposes.',
        'Backup copies may persist for a limited time before automatic deletion.',
      ],
    },
    {
      title: '8. Security',
      paragraphs: [
        'We use technical and organizational measures to protect personal data, including encryption in transit, hashed passwords, and access controls.',
        'No method of transmission or storage is 100% secure. Keep your login credentials confidential.',
      ],
    },
    {
      title: '9. Log & diagnostic data',
      paragraphs: [
        'If the app crashes or errors occur, we may collect diagnostic information (device model, OS version, app version, error timestamps). This data is used to improve stability and is not used to identify you beyond your account when you are signed in.',
      ],
    },
    {
      title: '10. Your rights',
      paragraphs: [
        'Depending on your location, you may have the right to access, correct, delete, restrict, or port your personal data, and to object to certain processing.',
        'You can delete your account in Settings → Delete account. You may also contact ' + SUPPORT_EMAIL + '.',
        'EEA/UK users may lodge a complaint with their local data protection authority.',
      ],
    },
    {
      title: '11. Children',
      paragraphs: [
        'The Service is not directed at children under 13 (or the minimum age in your country). We do not knowingly collect data from children. Contact us if you believe a child has provided personal data.',
      ],
    },
    {
      title: '12. International transfers',
      paragraphs: [
        'Your data may be processed in countries outside your own. Where required, we use appropriate safeguards such as standard contractual clauses approved by the European Commission.',
      ],
    },
    {
      title: '13. Changes to this policy',
      paragraphs: [
        'We may update this Privacy Policy from time to time. We will post the new version in the app and update the "Last updated" date. Material changes may require renewed consent where applicable.',
      ],
    },
  ],
  termsIntro:
    'Please read these Terms of Service ("Terms") carefully before using RepLock. Your access to and use of the Service is conditioned on your acceptance of these Terms.',
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
        'RepLock helps you earn screen time through exercise and manage access to distracting apps according to rules you set. Features vary by platform and subscription plan.',
        'We may modify, suspend, or discontinue features with reasonable notice where practicable.',
      ],
    },
    {
      title: '3. Subscriptions & billing',
      paragraphs: [
        'RepLock Pro and related paid features are offered on a subscription basis. Billing cycles are monthly or annual as shown at purchase.',
        'On iOS, payment is charged to your Apple ID account at confirmation of purchase. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. Manage or cancel in your Apple ID account settings.',
        'On web or Android (where available), payments may be processed by Stripe under their terms.',
        'Prices may change. We will give reasonable notice before price changes take effect for renewing subscriptions.',
      ],
    },
    {
      title: '4. Free trial',
      paragraphs: [
        'We may offer a free trial of Pro features. If you subscribe during a trial, you may be charged when the trial ends unless you cancel before then.',
        'We may change or end free trial offers at any time. Trial eligibility may be limited to one per user or device.',
      ],
    },
    {
      title: '5. Refunds',
      paragraphs: [
        'Refund requests for Apple purchases are handled by Apple under App Store policies. RepLock does not control Apple\'s refund decisions.',
        'For Stripe purchases, contact ' + SUPPORT_EMAIL + '. Refunds are granted at our discretion where required by law.',
        'When processing refund disputes, we may share relevant purchase and usage information with the payment platform.',
      ],
    },
    {
      title: '6. Acceptable use',
      paragraphs: [
        'Use RepLock only for personal wellbeing and lawful purposes.',
        'You may not reverse engineer the app, circumvent blocking or subscription limits, abuse trials, harass others, or use the Service to violate third-party rights.',
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
        'The Service may link to third-party sites or integrate third-party services (e.g. Apple, Google/Firebase, Stripe). We are not responsible for their content or practices. Review their terms and privacy policies.',
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
        'You may stop using the Service and delete your account at any time in Settings.',
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
        'We may update these Terms. Material changes will be communicated in the app or by email where appropriate. Continued use after changes take effect constitutes acceptance.',
      ],
    },
    {
      title: '15. Contact',
      paragraphs: ['Questions about these Terms: ' + SUPPORT_EMAIL],
    },
  ],
}

const legalNl: LegalDocument = {
  lastUpdated: 'juli 2026',
  privacyIntro:
    'Dit privacybeleid beschrijft hoe RepLock ("wij", "ons") persoonsgegevens verzamelt, gebruikt, bewaart en beschermt wanneer je de RepLock-app en gerelateerde diensten (de "Dienst") gebruikt. Door de Dienst te gebruiken ga je akkoord met dit beleid.',
  privacySections: [
    {
      title: '1. Wie wij zijn',
      paragraphs: [
        'RepLock is verwerkingsverantwoordelijke voor persoonsgegevens via de Dienst, behalve waar we verwerkers inschakelen die hieronder staan.',
        'Vragen of uitoefening van rechten: ' + SUPPORT_EMAIL + '.',
      ],
    },
    {
      title: '2. Welke gegevens we verzamelen',
      paragraphs: [
        'Accountgegevens: naam, e-mailadres en veilig gehasht wachtwoord.',
        'Workout- en gebruiksgegevens: oefeningen, reps, streaks, verdiende schermtijd, moeilijkheidsgraad en voorkeuren.',
        'Blokkeerinstellingen: apps die je wilt beperken, dagelijkse openingen en schema\'s. Op Android slaan we package-namen op om limieten af te dwingen.',
        'Abonnementsgegevens: abonnementstype, proefstatus en transactie-ID\'s via Apple of Stripe. We slaan geen volledige kaartgegevens op.',
        'Technische gegevens: apparaattype, besturingssysteem, app-versie, taal en geanonimiseerde crashlogs.',
      ],
    },
    {
      title: '3. App-blokkering & apparaatgegevens',
      paragraphs: [
        'Op Android kan RepLock systeem-API\'s gebruiken die je expliciet inschakelt. Blokkeerkeuzes blijven waar mogelijk op je apparaat.',
        'Op iOS kunnen apps van derden andere geïnstalleerde apps niet op dezelfde manier blokkeren. RepLock volgt limieten in de app en gebruikt Apple-goedgekeurde API\'s wanneer beschikbaar.',
        'We verkopen je gegevens niet en gebruiken blokkeerdata niet voor advertentieprofielen.',
      ],
    },
    {
      title: '4. Hoe we gegevens gebruiken',
      paragraphs: [
        'Om de Dienst te leveren, voortgang te synchroniseren, abonnementen te verwerken, meldingen te sturen (indien ingeschakeld) en de app te verbeteren.',
      ],
    },
    {
      title: '5. Rechtsgronden (EER/VK)',
      paragraphs: [
        'We verwerken op basis van contractuitvoering, toestemming waar nodig, gerechtvaardigd belang en wettelijke verplichtingen.',
      ],
    },
    {
      title: '6. Delen met derden',
      paragraphs: [
        'We delen gegevens met verwerkers zoals Firebase (auth/sync), Apple (IAP), Stripe (betalingen) en hostingproviders, alleen voor zover nodig.',
      ],
    },
    {
      title: '7. Bewaartermijn',
      paragraphs: [
        'We bewaren gegevens zolang je account actief is. Na verwijdering wissen of anonimiseren we gegevens binnen een redelijke termijn, behalve waar de wet anders vereist.',
      ],
    },
    {
      title: '8. Beveiliging',
      paragraphs: [
        'We gebruiken passende technische en organisatorische maatregelen. Houd je inloggegevens geheim.',
      ],
    },
    {
      title: '9. Log- & diagnostische gegevens',
      paragraphs: [
        'Bij crashes kunnen we diagnostische gegevens verzamelen om stabiliteit te verbeteren.',
      ],
    },
    {
      title: '10. Jouw rechten',
      paragraphs: [
        'Je hebt recht op inzage, correctie, verwijdering, beperking, overdraagbaarheid en bezwaar waar van toepassing. Verwijder je account via Instellingen. EER-gebruikers kunnen klagen bij de Autoriteit Persoonsgegevens.',
      ],
    },
    {
      title: '11. Kinderen',
      paragraphs: [
        'De Dienst is niet bedoeld voor kinderen onder 13. We verzamelen niet bewust gegevens van kinderen.',
      ],
    },
    {
      title: '12. Internationale doorgifte',
      paragraphs: [
        'Gegevens kunnen buiten je land worden verwerkt met passende waarborgen waar vereist.',
      ],
    },
    {
      title: '13. Wijzigingen',
      paragraphs: [
        'We kunnen dit beleid bijwerken. De datum "Laatst bijgewerkt" wordt aangepast.',
      ],
    },
  ],
  termsIntro:
    'Lees deze Gebruiksvoorwaarden ("Voorwaarden") zorgvuldig door voordat je RepLock gebruikt.',
  termsSections: [
    {
      title: '1. Acceptatie',
      paragraphs: [
        'Door RepLock te gebruiken ga je akkoord met deze Voorwaarden en het privacybeleid.',
      ],
    },
    {
      title: '2. De Dienst',
      paragraphs: [
        'RepLock helpt je schermtijd te verdienen met beweging en afleidende apps te beperken volgens jouw regels. Functies verschillen per platform en abonnement.',
      ],
    },
    {
      title: '3. Abonnementen & betaling',
      paragraphs: [
        'RepLock Pro wordt aangeboden als abonnement. Op iOS wordt via je Apple ID afgerekend; abonnementen verlengen automatisch tenzij je minstens 24 uur van tevoren opzegt in je Apple ID-instellingen. Op web/Android kan Stripe worden gebruikt.',
      ],
    },
    {
      title: '4. Gratis proefperiode',
      paragraphs: [
        'We kunnen een gratis proef aanbieden. Na afloop kan automatisch worden afgerekend tenzij je opzegt.',
      ],
    },
    {
      title: '5. Restituties',
      paragraphs: [
        'Restituties voor Apple-aankopen worden door Apple afgehandeld. Voor Stripe: neem contact op via ' + SUPPORT_EMAIL + '.',
      ],
    },
    {
      title: '6. Toegestaan gebruik',
      paragraphs: [
        'Gebruik RepLock voor persoonlijk welzijn en wettige doeleinden. Misbruik, omzeiling of schending van rechten is niet toegestaan.',
      ],
    },
    {
      title: '7. Gezondheid & fitness',
      paragraphs: [
        'RepLock is geen medisch advies. Raadpleeg een arts vóór je begint met trainen. Je traint op eigen risico.',
      ],
    },
    {
      title: '8. Intellectueel eigendom',
      paragraphs: [
        'RepLock en bijbehorende content zijn beschermd. Je krijgt een beperkte licentie voor persoonlijk gebruik.',
      ],
    },
    {
      title: '9. Diensten van derden',
      paragraphs: [
        'We zijn niet verantwoordelijk voor websites of diensten van derden (Apple, Firebase, Stripe).',
      ],
    },
    {
      title: '10. Uitsluiting van garanties',
      paragraphs: [
        'DE DIENST WORDT GELEVERD "AS IS" ZONDER GARANTIES. We garanderen geen ononderbroken werking of blokkering op elk apparaat.',
      ],
    },
    {
      title: '11. Beperking van aansprakelijkheid',
      paragraphs: [
        'Voor zover wettelijk toegestaan zijn wij niet aansprakelijk voor indirecte schade. Onze totale aansprakelijkheid is beperkt tot het bedrag dat je in de voorgaande 12 maanden hebt betaald, of EUR 50 bij gratis gebruik.',
      ],
    },
    {
      title: '12. Beëindiging',
      paragraphs: [
        'Je kunt je account altijd verwijderen in Instellingen. Wij kunnen toegang opschorten bij schending van deze Voorwaarden.',
      ],
    },
    {
      title: '13. Toepasselijk recht',
      paragraphs: [
        'Deze Voorwaarden vallen onder Nederlands recht, tenzij dwingend consumentenrecht in jouw land anders bepaalt.',
      ],
    },
    {
      title: '14. Wijzigingen',
      paragraphs: [
        'We kunnen deze Voorwaarden bijwerken. Voortgezet gebruik na wijzigingen geldt als acceptatie.',
      ],
    },
    {
      title: '15. Contact',
      paragraphs: ['Vragen: ' + SUPPORT_EMAIL],
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
      '3. App-Blockierung & Gerätedaten',
      '4. Wie wir Daten nutzen',
      '5. Rechtsgrundlagen (EWR/VK)',
      '6. Weitergabe an Dritte',
      '7. Aufbewahrung',
      '8. Sicherheit',
      '9. Protokoll- & Diagnosedaten',
      '10. Deine Rechte',
      '11. Kinder',
      '12. Internationale Übermittlung',
      '13. Änderungen',
    ][i] ?? s.title,
  })),
  termsSections: legalEn.termsSections.map((s, i) => ({
    ...s,
    title: [
      '1. Annahme',
      '2. Der Dienst',
      '3. Abonnements & Abrechnung',
      '4. Kostenlose Testphase',
      '5. Erstattungen',
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
      '3. Blocage d\'apps & données appareil',
      '4. Utilisation des données',
      '5. Bases légales (EEE/RU)',
      '6. Partage avec des tiers',
      '7. Conservation',
      '8. Sécurité',
      '9. Journaux & diagnostics',
      '10. Tes droits',
      '11. Enfants',
      '12. Transferts internationaux',
      '13. Modifications',
    ][i] ?? s.title,
  })),
  termsSections: legalEn.termsSections.map((s, i) => ({
    ...s,
    title: [
      '1. Acceptation',
      '2. Le Service',
      '3. Abonnements & facturation',
      '4. Essai gratuit',
      '5. Remboursements',
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
      '3. Bloqueo de apps y datos del dispositivo',
      '4. Cómo usamos los datos',
      '5. Bases legales (EEE/RU)',
      '6. Compartir con terceros',
      '7. Conservación',
      '8. Seguridad',
      '9. Registros y diagnósticos',
      '10. Tus derechos',
      '11. Menores',
      '12. Transferencias internacionales',
      '13. Cambios',
    ][i] ?? s.title,
  })),
  termsSections: legalEn.termsSections.map((s, i) => ({
    ...s,
    title: [
      '1. Aceptación',
      '2. El Servicio',
      '3. Suscripciones y facturación',
      '4. Prueba gratuita',
      '5. Reembolsos',
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
  nl: legalNl,
  de: legalDe,
  fr: legalFr,
  es: legalEs,
}

export function getLegalDocument(locale: Locale): LegalDocument {
  return documents[locale] ?? documents.en
}
