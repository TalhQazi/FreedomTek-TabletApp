package com.freedomtek.games.ft2048

import android.content.Context

object GameSDK {
    /** Replace with real impl inside FreedomTek wrapper app */
    fun isKioskMode(context: Context): Boolean = true

    fun getAuthenticatedUserId(context: Context): String = "inmate-unknown"

    fun logEvent(context: Context, event: String, properties: Map<String, Any?> = emptyMap()) {
        // No-op stub. FreedomTek shell should intercept via instrumentation or binder.
        android.util.Log.i("FT-GAME", "EVENT: $event -> $properties")
    }

    fun checkEntitlement(context: Context, gameId: String): Boolean {
        // Stub: replace with wallet/entitlement checks from FreedomTek
        return true
    }
}
