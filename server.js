import { createRequire} from "module";
const require = createRequire(import.meta.url);

require('dotenv').config();

const jwt = require('jsonwebtoken');
const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
})

pool.query('SELECT NOW()', (err, res) =>  {
    if (err) {
        console.log("Connction failed");
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
        const queryText = `
            INSERT INTO users (username, password_hash) 
            VALUES ($1, $2)
            RETURNING id, username, created_at;
        `;
        const values = [username, password];
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

        if (user.password_hash !== password) {
            return res.status(400).json({ error: "Invalid username or password" });
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

app.listen(port, () => {console.log(`Server started on port ${port}`)});