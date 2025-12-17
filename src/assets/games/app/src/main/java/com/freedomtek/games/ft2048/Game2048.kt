package com.freedomtek.games.ft2048

import kotlin.random.Random

class Game2048(private val size: Int = 4) {
    val grid = Array(size) { IntArray(size) }
    var score: Int = 0
        private set
    var bestScore: Int = 0
    var won: Boolean = false
    var lost: Boolean = false

    private val rng = Random(System.currentTimeMillis())
    private var lastState: Array<IntArray>? = null
    private var lastScore: Int = 0

    fun reset() {
        for (r in 0 until size) for (c in 0 until size) grid[r][c] = 0
        score = 0
        won = false
        lost = false
        addRandomTile()
        addRandomTile()
        saveState()
    }

    private fun saveState() {
        lastState = Array(size) { r -> grid[r].clone() }
        lastScore = score
    }

    fun undo() {
        val s = lastState ?: return
        for (r in 0 until size) {
            for (c in 0 until size) {
                grid[r][c] = s[r][c]
            }
        }
        score = lastScore
        won = false
        lost = false
    }

    private fun addRandomTile() {
        val empties = mutableListOf<Pair<Int, Int>>()
        for (r in 0 until size) for (c in 0 until size)
            if (grid[r][c] == 0) empties.add(r to c)
        if (empties.isEmpty()) return
        val (r, c) = empties[rng.nextInt(empties.size)]
        grid[r][c] = if (rng.nextInt(10) == 0) 4 else 2
    }

    private fun canMove(): Boolean {
        // Any empty?
        for (r in 0 until size) for (c in 0 until size) if (grid[r][c] == 0) return true
        // Adjacent equals?
        for (r in 0 until size) for (c in 0 until size) {
            val v = grid[r][c]
            if (r+1 < size && grid[r+1][c] == v) return true
            if (c+1 < size && grid[r][c+1] == v) return true
        }
        return false
    }

    enum class Dir { UP, DOWN, LEFT, RIGHT }

    fun move(dir: Dir): Boolean {
        if (won || lost) return false
        saveState()
        var moved = false
        when (dir) {
            Dir.LEFT -> {
                for (r in 0 until size) moved = moveLine(grid[r]) || moved
            }
            Dir.RIGHT -> {
                for (r in 0 until size) moved = moveLine(grid[r].reversedArray()).also {
                    // write back reversed
                    grid[r] = grid[r].reversedArray()
                } || moved
                // The above approach is clunky; fix with a copy pass:
                for (r in 0 until size) {
                    val rev = grid[r].reversedArray()
                    moveLine(rev)
                    grid[r] = rev.reversedArray()
                }
            }
            Dir.UP -> {
                for (c in 0 until size) {
                    val col = IntArray(size) { grid[it][c] }
                    val before = col.clone()
                    moved = moveLine(col) || moved
                    for (r in 0 until size) grid[r][c] = col[r]
                    if (!before.contentEquals(col)) moved = true
                }
            }
            Dir.DOWN -> {
                for (c in 0 until size) {
                    val col = IntArray(size) { grid[it][c] }.reversedArray()
                    val before = col.clone()
                    moveLine(col)
                    val out = col.reversedArray()
                    for (r in 0 until size) grid[r][c] = out[r]
                    if (!before.reversedArray().contentEquals(out)) moved = true
                }
            }
        }
        if (moved) {
            addRandomTile()
            if (!canMove()) lost = true
        }
        return moved
    }

    private fun moveLine(line: IntArray): Boolean {
        var moved = false
        // compress
        var insert = 0
        val out = IntArray(line.size)
        for (v in line) if (v != 0) out[insert++] = v
        // merge
        var i = 0
        while (i < out.size - 1) {
            if (out[i] != 0 && out[i] == out[i+1]) {
                out[i] *= 2
                score += out[i]
                out[i+1] = 0
                if (out[i] == 2048) won = true
                i += 2
            } else i += 1
        }
        // compress again
        insert = 0
        val final = IntArray(out.size)
        for (v in out) if (v != 0) final[insert++] = v

        if (!line.contentEquals(final)) {
            for (j in line.indices) line[j] = final[j]
            moved = true
        }
        return moved
    }
}
