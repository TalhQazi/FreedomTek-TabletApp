package com.freedomtek.games.ft2048

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import kotlin.math.abs

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            FTApp()
        }
    }
}

@Composable
fun FTApp() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val game = remember { Game2048(4).apply { reset() } }
    var score by remember { mutableStateOf(0) }
    var best by remember { mutableStateOf(0) }
    val soundEnabled by Prefs.soundEnabledFlow(context).collectAsState(initial = true)

    LaunchedEffect(Unit) {
        Prefs.bestScoreFlow(context).collect { best = it }
    }

    fun updateBest() {
        if (game.score > best) {
            scope.launch { Prefs.setBestScore(context, game.score) }
        }
    }

    MaterialTheme {
        Surface(Modifier.fillMaxSize()) {
            BackHandler(enabled = true) {
                // Swallow back presses to keep users inside kiosk; log intent
                GameSDK.logEvent(context, "back_blocked")
            }
            Column(
                Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("FT 2048", fontSize = 28.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatCard("Score", game.score)
                    StatCard("Best", best)
                }
                Spacer(Modifier.height(12.dp))
                Board(game) {
                    score = game.score
                    updateBest()
                    GameSDK.logEvent(context, "move", mapOf("score" to game.score))
                }
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = {
                        game.reset()
                        score = 0
                        GameSDK.logEvent(context, "reset")
                    }) { Text("New Game") }
                    OutlinedButton(onClick = {
                        game.undo()
                        score = game.score
                        GameSDK.logEvent(context, "undo")
                    }) { Text("Undo") }
                    OutlinedButton(onClick = {
                        // Toggle sound setting (placeholder in this sample)
                        scope.launch { Prefs.setSoundEnabled(context, !soundEnabled) }
                    }) { Text(if (soundEnabled) "Sound: On" else "Sound: Off") }
                }
                Spacer(Modifier.height(8.dp))
                if (game.won) Text("You made 2048!", color = Color(0xFF388E3C), fontWeight = FontWeight.Bold)
                if (game.lost) Text("No moves left.", color = Color(0xFFD32F2F), fontWeight = FontWeight.Bold)
                Spacer(Modifier.weight(1f))
                Text(
                    "FreedomTek™ Secure Games",
                    fontSize = 12.sp,
                    color = Color.Gray,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            }
        }
    }
}

@Composable
fun StatCard(label: String, value: Int) {
    Card(shape = RoundedCornerShape(12.dp)) {
        Column(Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(label, fontSize = 14.sp, color = Color.Gray)
            Text("$value", fontSize = 20.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun Board(game: Game2048, onMoved: () -> Unit) {
    val tileColors = mapOf(
        0 to Color(0xFFCDC1B4),
        2 to Color(0xFFEEE4DA),
        4 to Color(0xFFEDE0C8),
        8 to Color(0xFFF2B179),
        16 to Color(0xFFF59563),
        32 to Color(0xFFF67C5F),
        64 to Color(0xFFF65E3B),
        128 to Color(0xFFEDCF72),
        256 to Color(0xFFEDCC61),
        512 to Color(0xFFEDC850),
        1024 to Color(0xFFEDC53F),
        2048 to Color(0xFFEDC22E)
    )
    var start by remember { mutableStateOf(Offset.Zero) }
    var end by remember { mutableStateOf(Offset.Zero) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(1f)
            .background(Color(0xFFBBADA0), RoundedCornerShape(16.dp))
            .padding(12.dp)
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragStart = { start = it },
                    onDragEnd = {
                        val dx = end.x - start.x
                        val dy = end.y - start.y
                        val thresh = 40f
                        val moved = when {
                            abs(dx) > abs(dy) && abs(dx) > thresh -> {
                                if (dx > 0) game.move(Game2048.Dir.RIGHT) else game.move(Game2048.Dir.LEFT)
                            }
                            abs(dy) > thresh -> {
                                if (dy > 0) game.move(Game2048.Dir.DOWN) else game.move(Game2048.Dir.UP)
                            }
                            else -> false
                        }
                        if (moved) onMoved()
                        start = Offset.Zero
                        end = Offset.Zero
                    }
                ) { change, dragAmount ->
                    change.consume()
                    end = change.position
                }
            },
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        for (r in 0 until 4) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                for (c in 0 until 4) {
                    val v = game.grid[r][c]
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .aspectRatio(1f)
                            .background(tileColors[v] ?: Color(0xFF3C3A32), RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        if (v != 0)
                            Text("$v", fontSize = when {
                                v < 128 -> 24.sp
                                v < 1024 -> 22.sp
                                else -> 18.sp
                            }, fontWeight = FontWeight.Bold, color = if (v <= 4) Color(0xFF776E65) else Color.White)
                    }
                }
            }
        }
    }
}
