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

        // Player joins or updates state
        socket.on('update_state', (data) => {
            // data: { nickname, stage, score }
            activeSessions[socket.id] = data;
            // Broadcast to admins (or everyone for simplicity in this demo)
            io.emit('session_update', activeSessions);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            delete activeSessions[socket.id];
            io.emit('session_update', activeSessions);
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
    app.post('/api/ranks', (req, res) => {
        const { nickname, score } = req.body;

        if (!nickname || score === undefined) {
            res.status(400).json({ error: "Nickname and score are required" });
            return;
        }

        // Check if user exists
        db.get("SELECT score FROM ranks WHERE nickname = ?", [nickname], (err, row) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }

            if (row) {
                // User exists, update if new score is higher
                if (score > row.score) {
                    db.run("UPDATE ranks SET score = ? WHERE nickname = ?", [score, nickname], function (err) {
                        if (err) {
                            res.status(400).json({ error: err.message });
                            return;
                        }
                        res.json({ message: "Score updated", nickname, score });
                    });
                } else {
                    // New score is lower or equal, do nothing
                    res.json({ message: "Score not updated (existing score is higher or equal)", nickname, score: row.score });
                }
            } else {
                // User does not exist, insert
                db.run("INSERT INTO ranks (nickname, score) VALUES (?, ?)", [nickname, score], function (err) {
                    if (err) {
                        res.status(400).json({ error: err.message });
                        return;
                    }
                    res.json({ message: "New rank added", nickname, score });
                });
            }
        });
    });

    server.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
