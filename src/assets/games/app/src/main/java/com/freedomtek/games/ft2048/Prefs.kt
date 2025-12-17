package com.freedomtek.games.ft2048

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore("ft2048_prefs")
object Prefs {
    private val KEY_BEST = intPreferencesKey("best_score")
    private val KEY_SOUND = booleanPreferencesKey("sound_enabled")

    fun bestScoreFlow(context: Context): Flow<Int> =
        context.dataStore.data.map { it[KEY_BEST] ?: 0 }

    suspend fun setBestScore(context: Context, v: Int) {
        context.dataStore.edit { it[KEY_BEST] = v }
    }

    fun soundEnabledFlow(context: Context): Flow<Boolean> =
        context.dataStore.data.map { it[KEY_SOUND] ?: true }

    suspend fun setSoundEnabled(context: Context, v: Boolean) {
        context.dataStore.edit { it[KEY_SOUND] = v }
    }
}
