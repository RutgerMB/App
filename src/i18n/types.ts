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
  }
  nav: {
    home: string
    exercise: string
    apps: string
    activity: string
    settings: string
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
  }
  exercises: Record<string, { name: string; description: string }>
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
    unlockedFor: string
    limitReached: string
    limitReachedExpired: string
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
    bonusEarned: string
    baseEarned: string
  }
  settings: {
    title: string
    profile: string
    subscription: string
    notifications: string
    notificationsEnabled: string
    resetDaily: string
    resetDailyDesc: string
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
    blockingLearnMore: string
    version: string
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
    perMonth: string
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
    trialNote: string
    testMode: string
    alreadyPro: string
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
