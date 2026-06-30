import { createRequire} from "module";
const require = createRequire(import.meta.url);

require('dotenv').config();

const jwt = require('jsonwebtoken');
const express = require('express');
const { Pool } = require('pg');
const app = express();
const bcrypt = require("bcrypt");
const port = process.env.PORT || 3000;
app.use(express.json());

const isTest = process.env.NODE_ENV === 'test';

const pool = new Pool({
    host: process.env.DB_HOST,
    port: isTest ? process.env.TEST_DB_PORT : process.env.DB_PORT,
    user: isTest ? process.env.TEST_DB_USER : process.env.DB_USER,
    password: isTest ? process.env.TEST_DB_PASSWORD : process.env.DB_PASSWORD,
    database: isTest ? process.env.TEST_DB_NAME : process.env.DB_NAME,
});

pool.query('SELECT NOW()', (err, res) =>  {
    if (err) {
        console.log(err);
        console.log("Connection failed");
    } else {
        console.log("Connected!");
    }
})

app.get('/api/test', (req, res) => {
    res.send("WSL Server is alive and reaching WebStorm!");
});

app.post("/api/auth/register", async (req, res) => {
    const {username, password} = req.body;

    if (!username || !password) {
        return res.status(400).json({error: "Username and password are required"});
    }

    try {
        const saltRounds = 10;
        const hashed_password = await bcrypt.hash(password, saltRounds);

        const queryText = `
            INSERT INTO users (username, password_hash) 
            VALUES ($1, $2)
            RETURNING id, username, created_at;
        `;
        const values = [username, hashed_password];
        const dbResult = await pool.query(queryText, values);

        res.status(201).json({
            message: "User registered successfully!",
            user: dbResult.rows[0],
        })
    } catch (error) {
        console.error("Registration error details: " + error.message);

        if (error.code === '23505') {
            return res.status(409).json({error: "Username already taken"});
        }

        return res.status(500).json({error: "Internal Server Error"});
    }
})

app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const queryText = `
            SELECT id, username, password_hash
            FROM users
            WHERE username = $1;
        `;

        const dbResult = await pool.query(queryText, [username]);

        if (dbResult.rows.length === 0) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        const user = dbResult.rows[0];

        if (!(await bcrypt.compare(password, user.password_hash))) {
            return res.status(409).json({ error: "Invalid username or password" });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            message: "User logged in successfully",
            token: token,
            user: {
                id: user.id,
                username: user.username
            }
        });

    } catch (error) {
        console.error("Login error details: " + error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.delete("/api/auth/deleteAccount", async (req, res) => {
    const authHeader = req.headers['authorization'];

    // FIX: Flipped logic condition. Deny if it DOES NOT start with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    const token = authHeader.split(" ")[1];

    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.username !== username) {
            return res.status(403).json({ error: "Forbidden. You can only delete your own account." });
        }

        const queryText = `
            SELECT password_hash FROM users
            WHERE username = $1;
        `;
        const dbResult = await pool.query(queryText, [username]);

        if (dbResult.rows.length === 0) {
            return res.status(404).json({ error: "Invalid username" });
        }

        if (!(await bcrypt.compare(password, dbResult.rows[0].password_hash))) {
            return res.status(400).json({ error: "Incorrect password" });
        }

        await pool.query(`DELETE FROM users WHERE username = $1;`, [username]);

        return res.status(200).json({ message: "Successfully deleted account" });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Invalid or expired token. Please log in again." });
        }

        console.error("Delete account error details: " + error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});








app.listen(port, () => {console.log(`Server started on port ${port}`)});