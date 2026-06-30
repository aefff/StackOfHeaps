import { createRequire} from "module";
const require = createRequire(import.meta.url);

require('dotenv').config();

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

app.listen(port, () => {console.log(`Server started on port ${port}`)});