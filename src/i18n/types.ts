export type Locale = 'en' | 'nl' | 'de' | 'fr' | 'es'

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

export interface Translations {
  common: {
    continue: string
    loading: string
    cancel: string
    upgrade: string
    pro: string
    free: string
    locked: string
    unlocked: string
    add: string
    manage: string
    viewAll: string
    minutes: string
    days: string
    reps: string
    seconds: string
    tap: string
    back: string
    close: string
  }
  nav: {
    home: string
    exercise: string
    apps: string
    activity: string
    settings: string
  }
  intro: {
    slide1Headline: string
    slide2Headline: string
    slide3Headline: string
    slide1Subtitle: string
    slide2Subtitle: string
    slide3Subtitle: string
    begin: string
    haveAccount: string
    authChoiceTitle: string
    authChoiceSubtitle: string
    backToLogin: string
    legalPrefix: string
    legalAnd: string
    getStartedWith: string
    continueEmail: string
    setupIntroTitle: string
    setupIntroDesc: string
    screenTimeQuestion: string
    screenTimeHint: string
    screenTimeFooter: string
    privacySheetTitle: string
    privacySheetDesc: string
    privacyStatTitle: string
    privacyStatDesc: string
    privacyBlockTitle: string
    privacyBlockDesc: string
    privacyLearnMore: string
    revealTitle: string
    revealSubtitle: string
    revealPercentLess: string
    revealYouThought: string
    revealWithRepLock: string
    revealActualLabel: string
    revealActualLess: string
    revealActualMore: string
    revealFromDevice: string
    revealEstimateOnly: string
    yearsPerDay: string
    yearsBasedOnDevice: string
    yearsBasedOnEstimate: string
    yearsTitle: string
    yearsLabel: string
    yearsOnPhone: string
    yearsFootnote: string
    yearsCta: string
    potentialTitle: string
    potentialSubtitle: string
    potentialScrollLabel: string
    potentialWorkoutsLabel: string
    potentialNow: string
    potentialWith: string
    weekOneTitle: string
    weekOneDesc: string
    weekOneFootnote: string
    benefitsTitle: string
    benefitsSubtitle: string
    benefit1: string
    benefit2: string
    benefit3: string
    benefit4: string
    benefit5: string
    holdTitle: string
    holdHint: string
    holdLogo: string
    blockPreviewTitle: string
    blockPreview: {
      hint: string
      workout: { title: string; body: string; rule: string }
      streak: { title: string; body: string; rule: string }
      focus: { title: string; body: string; rule: string }
    }
  }
  auth: {
    loginTitle: string
    loginSubtitle: string
    registerTitle: string
    registerSubtitle: string
    email: string
    password: string
    confirmPassword: string
    displayName: string
    passwordHint: string
    signIn: string
    signOut: string
    createAccount: string
    noAccount: string
    haveAccount: string
    welcomeBack: string
    accountCreated: string
    loginFailed: string
    registerFailed: string
    passwordMismatch: string
    passwordTooShort: string
    devLogin: string
    devCode: string
    devPassword: string
    devLoginSubmit: string
    devLoginHint: string
    devLoginSuccess: string
    devLoginFailed: string
    agreeTerms: string
    termsRequired: string
    deleteAccount: string
    deleteAccountDesc: string
    deleteAccountConfirm: string
    deleteAccountWarning: string
    deleteAccountPassword: string
    deleteAccountSubmit: string
    deleteAccountSuccess: string
  }
  onboarding: {
    tagline: string
    getStarted: string
    howItWorks: string
    howItWorksDesc: string
    feature1Title: string
    feature1Desc: string
    feature2Title: string
    feature2Desc: string
    feature3Title: string
    feature3Desc: string
    chooseLanguage: string
    chooseLanguageDesc: string
    yourName: string
    yourNameDesc: string
    nameLabel: string
    namePlaceholder: string
    startEarning: string
    chooseDifficulty: string
    chooseDifficultyDesc: string
    selectAppsTitle: string
    selectAppsDesc: string
    selectAppsHint: string
    selectAppsSkipHint: string
    selectAppsRequired: string
    usePopularDefaults: string
    screenTimePermissionTitle: string
    screenTimePermissionDesc: string
    screenTimePermissionAndroid: string
    screenTimePermissionIos: string
    screenTimePermissionIosAuthorize: string
    screenTimePermissionIosEstimate: string
    screenTimePermissionIosSkip: string
    screenTimeIosAuthorized: string
    screenTimeIosError_denied: string
    screenTimeIosError_plugin_missing: string
    screenTimeIosError_failed: string
    screenTimeIosError_unsupported: string
    screenTimePermissionWeb: string
    screenTimePermissionOpenSettings: string
    screenTimePermissionGranted: string
    screenTimePermissionRefresh: string
    blocklistLoading: string
    blocklistSearch: string
    blocklistSelected: string
    blocklistEmpty: string
    blocklistWebHint: string
    categories: Record<string, string>
    trialContinueFree: string
    trialContinueFreeDesc: string
    createGoalTitle: string
    createGoalDesc: string
    createGoalHint: string
    openingsLabel: string
    goalCreatedTitle: string
    goalCreatedDesc: string
    goalActiveLabel: string
    goalSchedule: string
    goalProgress: string
    notificationsTitle: string
    notificationsDesc: string
    notificationsAllow: string
    notificationsSkip: string
    notificationsNow: string
    notificationsMock: {
      workout: { title: string; body: string }
      streak: { title: string; body: string }
      earned: { title: string; body: string }
    }
    trialTitle: string
    trialDesc: string
    trialViewPro: string
    trialSteps: {
      today: { when: string; title: string; desc: string }
      day5: { when: string; title: string; desc: string }
      day7: { when: string; title: string; desc: string }
    }
    weekdays: {
      sunday: string
      monday: string
      tuesday: string
      wednesday: string
      thursday: string
      friday: string
      saturday: string
    }
  }
  difficulty: {
    earnRate: string
    easy: { name: string; desc: string }
    medium: { name: string; desc: string }
    hard: { name: string; desc: string }
    unstoppable: { name: string; desc: string }
    proOnly: string
  }
  proPromo: {
    cta: string
    home: { title: string; desc: string }
    exercise: { title: string; desc: string }
    apps: { title: string; desc: string }
    activity: { title: string; desc: string }
    settings: { title: string; desc: string }
  }
  home: {
    welcomeBack: string
    availableScreenTime: string
    earnMore: string
    streak: string
    workouts: string
    appsTracked: string
    yourApps: string
    unlocked: string
    locked: string
    noAppsYet: string
    viewAll: string
    unlockedNow: string
    lockedApps: string
    lockedDesc: string
    lastWorkout: string
    quickStart: string
    changeDifficultyDesc: string
    earnFirst: string
    emptyBalanceHint: string
    viewAllApps: string
    appsStatusSummary: string
  }
  exercise: {
    title: string
    subtitle: string
    earnRates: string
    perRep: string
    perSecondHeld: string
    highReward: string
    standard: string
    startWorkout: string
    completeReps: string
    holdAsLong: string
    targetEarn: string
    workoutComplete: string
    screenTimeEarned: string
    claim: string
    pause: string
    resume: string
    finish: string
    reset: string
    earning: string
    ofReps: string
    byMuscle: string
    plannedWorkouts: string
    showMoreWorkouts: string
    showFewerWorkouts: string
    startExercise: string
    focusOn: string
    planWorkout: string
    planWorkoutDesc: string
    totalReps: string
    totalSeconds: string
    numberOfSets: string
    setsRequired: string
    perSetPreview: string
    estimatedEarn: string
    reps: string
    seconds: string
    setOf: string
    holdFor: string
    finishedSet: string
    restTitle: string
    restDesc: string
    startSet: string
    claimTime: string
    completedReps: string
    completedTotal: string
    watchDemo: string
    watchDemoHint: string
    invalidType: string
    workoutNotFound: string
  }
  exercises: Record<string, { name: string; description: string; howTo?: string; focus?: string }>
  categories: Record<string, string>
  workoutPlans: Record<string, { name: string; description: string }>
  apps: {
    title: string
    appsCount: string
    available: string
    dailyLimit: string
    left: string
    unlockWithTime: string
    activeUntil: string
    noApps: string
    addFirst: string
    addApp: string
    appName: string
    appNamePlaceholder: string
    icon: string
    dailyLimitLabel: string
    unlockApp: string
    unlockDesc: string
    balance: string
    unlockFor: string
    notEnoughBalance: string
    openingsLimitReached: string
    unlockedFor: string
    limitReached: string
    limitReachedExpired: string
    chooseFromDevice: string
    deviceAppsNative: string
    deviceAppsWeb: string
    deviceAppsIos: string
    iosPickAppsHint: string
    iosPickAppsButton: string
    iosPickAppsAgain: string
    iosNoAppsPicked: string
    iosPickError_denied: string
    iosPickError_plugin_missing: string
    iosPickError_auth_required: string
    iosPickError_failed: string
    iosPickError_unsupported: string
    iosNotAvailable: string
    noInstalledApps: string
    searchApps: string
    allCategories: string
    noAppsFound: string
    setDailyLimit: string
    editLimit: string
    editLimitTitle: string
    saveLimit: string
    limitUpdated: string
    categories: Record<string, string>
    quickBlockTitle: string
    quickBlockDesc: string
    quickBlockCta: string
    activeScheduleTitle: string
    appsTrackedLabel: string
    templatesTitle: string
    templateComingSoon: string
    templates: {
      gym_focus: { title: string; desc: string }
      morning_workout: { title: string; desc: string }
      earn_scroll: { title: string; desc: string }
    }
  }
  blocker: {
    setupTitle: string
    setupDesc: string
    setupNoApps: string
    enableButton: string
    readyTitle: string
    readyDesc: string
    promptTitle: string
    promptDesc: string
    promptStep1: string
    promptStep2: string
    promptStep3: string
    promptPrivacy: string
    grantButton: string
    skipButton: string
    promptWaiting: string
    promptSuccess: string
    iosSetupTitle: string
    iosSetupDesc: string
    iosSetupNoApps: string
    iosEnableButton: string
    iosPromptTitle: string
    iosPromptDesc: string
    iosPromptStep1: string
    iosPromptStep2: string
    iosPromptStep3: string
    iosPromptPrivacy: string
    iosGrantButton: string
  }
  activity: {
    title: string
    subtitle: string
    workouts: string
    earned: string
    bestStreak: string
    dayStreak: string
    keepGoing: string
    noWorkouts: string
    noWorkoutsDesc: string
    today: string
    insights: string
    todayVsYesterday: string
    todayLabel: string
    yesterdayLabel: string
    change: string
    periodWeek: string
    periodMonth: string
    periodYear: string
    totalEarned: string
    avgDaily: string
    bestDay: string
    categorySplit: string
    minutesEarned: string
    unlockInsights: string
    unlockInsightsDesc: string
    plannedWorkouts: string
    bonusLabel: string
    startPlan: string
    exercises: string
    stepOf: string
    planComplete: string
    planned: string
    bonusEarned: string
    baseEarned: string
  }
  settings: {
    title: string
    subtitle: string
    profile: string
    subscription: string
    notifications: string
    notificationsEnabled: string
    notificationsDisabled: string
    app: string
    resetDaily: string
    resetDailyDesc: string
    resetDailySuccess: string
    resetConfirm: string
    resetConfirmDesc: string
    help: string
    language: string
    difficulty: string
    difficultyUpdated: string
    lifetimeEarned: string
    memberSince: string
    upgradePro: string
    blockingTitle: string
    blockingCurrent: string
    blockingNative: string
    iosBlockingTitle: string
    iosBlockingDesc: string
    blockingLearnMore: string
    version: string
    legal: string
    privacyPolicy: string
    termsOfService: string
    contactSupport: string
    notificationsNote: string
    notificationsPermissionGranted: string
    notificationsPermissionDenied: string
    deleteAccount: string
    manageSubscription: string
    manageSubscriptionDesc: string
    subscriptionNativeFailed: string
  }
  trial: {
    fullAccess: string
    daysLeft: string
    hoursLeft: string
    trialEnded: string
    upgradeKeepApps: string
    trialFeatures: string
    onlyLeft: string
    endedDesc: string
    activeDesc: string
    viewPro: string
    upgradePro: string
    appsRemoved: string
  }
  pricing: {
    title: string
    subtitle: string
    trialEnded: string
    trialEndedDesc: string
    trialLeft: string
    trialFullAccess: string
    socialProof: string
    mostPopular: string
    monthly: string
    yearly: string
    perMonth: string
    perYear: string
    savePercent: string
    yearlyEquivalent: string
    yearlySavings: string
    lessThanCoffee: string
    feature1Title: string
    feature1Desc: string
    feature2Title: string
    feature2Desc: string
    feature3Title: string
    feature3Desc: string
    feature4Title: string
    feature4Desc: string
    feature5Title: string
    feature5Desc: string
    freePlan: string
    afterTrial: string
    freeApp: string
    mediumDifficulty: string
    basicTracking: string
    proPlan: string
    everything: string
    unlimitedApps: string
    customLimits: string
    difficultyModes: string
    streakProtection: string
    deepAnalytics: string
    noShortcuts: string
    noShortcutsBold: string
    onPro: string
    onProDesc: string
    upgrade: string
    keepAccess: string
    subscribe: string
    subscribeYearly: string
    trialNote: string
    mobileOnly: string
    mobileOnlyTitle: string
    mobileOnlyDesc: string
    storeTerms: string
    testMode: string
    alreadyPro: string
    subscribeApple: string
    restorePurchases: string
    restored: string
    noRestore: string
    checkoutFailed: string
    proUnlockedOffline: string
    appleTerms: string
    stripeTerms: string
  }
  legal: {
    privacyTitle: string
    termsTitle: string
    lastUpdated: string
    privacyIntro: string
    dataWeCollect: string
    dataWeCollectBody: string
    howWeUse: string
    howWeUseBody: string
    dataStorage: string
    dataStorageBody: string
    yourRights: string
    yourRightsBody: string
    contact: string
    contactBody: string
    termsIntro: string
    subscriptions: string
    subscriptionsBody: string
    acceptableUse: string
    acceptableUseBody: string
    disclaimer: string
    disclaimerBody: string
    termination: string
    terminationBody: string
  }
  success: {
    confirming: string
    welcome: string
    welcomeDesc: string
    startEarning: string
    error: string
    errorDesc: string
    backToPricing: string
  }
  cancel: {
    title: string
    desc: string
    backHome: string
  }
}
