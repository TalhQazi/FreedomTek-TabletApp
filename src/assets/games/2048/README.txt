FreedomTek 2048 (Android, Kotlin + Jetpack Compose)

Build:
1) Open in Android Studio (Giraffe/Flamingo or newer)
2) Let Gradle sync
3) Run on device or Build > Build APK

Notes:
- No network usage. Offline only.
- Min SDK 24, target 34, landscape.
- Undo supported (single step). Best score saved via DataStore.
- Back button is swallowed; integrate kiosk lock in FreedomTek shell.
- Integration stubs in GameSDK.kt (auth, entitlement, logging).
- Replace icon and branding as desired.

Next:
- Hook GameSDK methods to FreedomTek tablet shell for audit logs, time limits, and entitlement.
- iOS port in SwiftUI can mirror Game2048 logic.
