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

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

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
        const { nickname, score, secret } = data;

        // 1. Secret Key Validation (Optional but recommended for consistency)
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
        if (!Number.isFinite(numericScore) || !Number.isInteger(numericScore) || numericScore < 0 || numericScore > 50000) {
            return;
        }

        // 3. State-based Validation (Check against last reported score in activeSessions)
        const session = activeSessions[socket.id];
        if (!session) {
            console.warn(`[Socket] No active session found for ${socket.id} during score submission`);
            return;
        }

        // Allow some buffer (e.g., 20% or a small fixed value) for scores reported right before game over
        const reportedScore = Number(session.score) || 0;
        if (numericScore > reportedScore + 5000) {
            console.warn(`[Socket] Score anomaly detected for ${cleanNickname}: reported=${reportedScore}, submitted=${numericScore}`);
            return;
        }

        // 4. Update Database
        db.get("SELECT score FROM ranks WHERE nickname = ?", [cleanNickname], (err, row) => {
            if (err) return;

            if (row) {
                if (numericScore > row.score) {
                    db.run("UPDATE ranks SET score = ? WHERE nickname = ?", [numericScore, cleanNickname], function (err) {
                        if (err) return;
                        socket.emit('score_result', { status: 'success', message: "Score updated" });
                    });
                } else {
                    socket.emit('score_result', { status: 'ignored', message: "Existing score is higher" });
                }
            } else {
                db.run("INSERT INTO ranks (nickname, score) VALUES (?, ?)", [cleanNickname, numericScore], function (err) {
                    if (err) return;
                    socket.emit('score_result', { status: 'success', message: "New rank added" });
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
    }
});

// Create table if not exists
db.serialize(() => {
    db.run(`
            CREATE TABLE IF NOT EXISTS ranks (
                nickname TEXT PRIMARY KEY,
                score INTEGER
            )
        `);
});

// GET /api/ranks - Get Top 20
app.get('/api/ranks', (req, res) => {
    const sql = `SELECT nickname, score FROM ranks ORDER BY score DESC`;
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
