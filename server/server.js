require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity (or configure specific)
        methods: ["GET", "POST"]
    }
});

const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Socket.io Logic
let activeSessions = {}; // socketId -> { nickname, board, score }
let redlineThreshold = 60; // Global threshold for MP mode

// Load threshold from DB on startup
function loadSettings() {
    db.get("SELECT value FROM settings WHERE key = 'redlineThreshold'", (err, row) => {
        if (row) {
            redlineThreshold = Number(row.value);
            console.log(`Loaded redlineThreshold from DB: ${redlineThreshold}`);
        } else {
            // If doesn't exist, create it
            db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('redlineThreshold', '60')");
        }
    });
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send current threshold on connection
    socket.emit('threshold_update', redlineThreshold);

    // Chat message
    socket.on('chat_message', (msg) => {
        console.log('Chat message received:', msg);
        // msg: { nickname, text }
        io.emit('chat_message', msg);
    });

    // Player joins or updates state
    socket.on('update_state', (data) => {
        // data: { nickname, stage, score }
        activeSessions[socket.id] = data;
        // Broadcast to admins (or everyone for simplicity in this demo)
        io.emit('session_update', activeSessions);
    });

    // Admin updates redline threshold
    socket.on('update_threshold', (val) => {
        const newVal = Number(val);
        if (Number.isFinite(newVal) && newVal >= 0) {
            redlineThreshold = newVal;
            console.log(`Threshold updated to ${redlineThreshold} by ${socket.id}`);
            io.emit('threshold_update', redlineThreshold);

            // Broadcast system message to chat
            io.emit('chat_message', {
                nickname: 'SYSTEM',
                text: `[공지] 레드라인 삭제 기준 점수가 ${newVal}점으로 변경되었습니다.`
            });

            // Save to DB
            db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('redlineThreshold', ?)", [newVal.toString()]);
        }
    });

    // Admin triggers boom for a specific player
    socket.on('admin_boom', (targetId) => {
        console.log(`Admin (${socket.id}) triggered boom for: ${targetId}`);
        const targetSocket = io.sockets.sockets.get(targetId);
        if (targetSocket) {
            console.log(`Target socket found. Emitting admin_boom to ${targetId}`);
            io.to(targetId).emit('admin_boom');
        } else {
            console.log(`Target socket ${targetId} not found in this process!`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete activeSessions[socket.id];
        io.emit('session_update', activeSessions);
    });

    // Score submission via Socket.IO
    socket.on('submit_score', (data) => {
        const { nickname, score, secret, mode } = data;
        const gameMode = mode || 'MP'; // Default to MP for compatibility

        // 1. Secret Key Validation
        if (!safeEqual(secret, process.env.RANKING_SECRET)) {
            console.warn(`[Socket] Unauthorized score submission attempt from ${socket.id}`);
            return;
        }

        // 2. Data Validation
        const cleanNickname = (nickname ?? "").toString().trim();
        const numericScore = Number(score);

        if (!cleanNickname || cleanNickname.length > 20) {
            return;
        }
        if (!Number.isFinite(numericScore) || !Number.isInteger(numericScore) || numericScore < 0 || numericScore > 1000000) {
            return;
        }

        // 3. State-based Validation (Check against last reported score in activeSessions)
        const session = activeSessions[socket.id];
        if (!session) {
            console.warn(`[Socket] No active session found for ${socket.id} during score submission`);
            return;
        }

        const reportedScore = Number(session.score) || 0;
        if (numericScore > reportedScore + 5000) {
            console.warn(`[Socket] Score anomaly detected for ${cleanNickname}: reported=${reportedScore}, submitted=${numericScore}`);
            return;
        }

        // 4. Update Database
        db.get("SELECT score FROM ranks WHERE nickname = ? AND mode = ?", [cleanNickname, gameMode], (err, row) => {
            if (err) return;

            if (row) {
                if (numericScore > row.score) {
                    db.run("UPDATE ranks SET score = ? WHERE nickname = ? AND mode = ?", [numericScore, cleanNickname, gameMode], function (err) {
                        if (err) return;
                        socket.emit('score_result', { status: 'success', message: `${gameMode} Score updated!` });
                    });
                } else {
                    socket.emit('score_result', { status: 'ignored', message: `Existing ${gameMode} score is higher` });
                }
            } else {
                db.run("INSERT INTO ranks (nickname, score, mode) VALUES (?, ?, ?)", [cleanNickname, numericScore, gameMode], function (err) {
                    if (err) return;
                    socket.emit('score_result', { status: 'success', message: `New ${gameMode} rank added!` });
                });
            }
        });
    });
});

// Database Setup
// Use a file-based DB. In Docker, we should mount a volume to persist this.
const dbPath = path.resolve(__dirname, 'ranks.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to sqlite database');
        // Create settings table and load values
        db.serialize(() => {
            db.run("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)");
            loadSettings();
        });
    }
});

// Create table if not exists with mode support
db.serialize(() => {
    // Check if table exists and has 'mode' column
    db.all("PRAGMA table_info(ranks)", (err, columns) => {
        if (err) {
            console.error("Error checking table info", err);
            return;
        }

        if (columns.length === 0) {
            // Table doesn't exist at all
            db.run(`
                CREATE TABLE ranks (
                    nickname TEXT,
                    mode TEXT DEFAULT 'MP',
                    score INTEGER,
                    PRIMARY KEY (nickname, mode)
                )
            `);
            console.log("Created ranks table with mode support.");
        } else {
            const hasMode = columns.some(col => col.name === 'mode');
            if (!hasMode) {
                console.log("Migrating database: Adding 'mode' column and updating Primary Key...");
                db.serialize(() => {
                    db.run("ALTER TABLE ranks RENAME TO ranks_old");
                    db.run(`
                        CREATE TABLE ranks (
                            nickname TEXT,
                            mode TEXT DEFAULT 'MP',
                            score INTEGER,
                            PRIMARY KEY (nickname, mode)
                        )
                    `);
                    db.run("INSERT INTO ranks (nickname, score, mode) SELECT nickname, score, 'MP' FROM ranks_old");
                    db.run("DROP TABLE ranks_old");
                    console.log("Database migration completed.");
                });
            }
        }
    });
});

// GET /api/ranks - Get Top 20
app.get('/api/ranks', (req, res) => {
    const sql = `SELECT nickname, score, mode FROM ranks ORDER BY score DESC LIMIT 50`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            data: rows
        });
    });
});

// POST /api/ranks - Upsert Score
const crypto = require("crypto");

function safeEqual(a, b) {
    const ab = Buffer.from(a || "");
    const bb = Buffer.from(b || "");
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
}

app.post('/api/ranks', (req, res) => {
    const clientSecret = req.get('x-ranking-secret');

    if (!safeEqual(clientSecret, process.env.RANKING_SECRET)) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    const nickname = (req.body.nickname ?? "").toString().trim();
    const score = Number(req.body.score);

    if (!nickname || nickname.length > 20) {
        return res.status(400).json({ error: "Invalid nickname" });
    }
    if (!Number.isFinite(score) || !Number.isInteger(score) || score < 0 || score > 50000) {
        return res.status(400).json({ error: "Invalid score" });
    }

    db.get("SELECT score FROM ranks WHERE nickname = ?", [nickname], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });

        if (row) {
            if (score > row.score) {
                db.run("UPDATE ranks SET score = ? WHERE nickname = ?", [score, nickname], function (err) {
                    if (err) return res.status(400).json({ error: err.message });
                    return res.json({ message: "Score updated", nickname, score });
                });
            } else {
                return res.json({ message: "Score not updated", nickname, score: row.score });
            }
        } else {
            db.run("INSERT INTO ranks (nickname, score) VALUES (?, ?)", [nickname, score], function (err) {
                if (err) return res.status(400).json({ error: err.message });
                return res.json({ message: "New rank added", nickname, score });
            });
        }
    });
});


server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
