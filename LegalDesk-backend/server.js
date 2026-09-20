const express = require("express");
const dotenv = require("dotenv");
const { neon } = require("@neondatabase/serverless");

dotenv.config();

const app = express();
const PORT = 5000;

const sql = neon(process.env.DATABASE_URL);

app.get("/", (req, res) => {
    res.send("LegalDesk backend is running!");
});

app.get("/test-db", async (req, res) => {
    try {
        const result = await sql`SELECT NOW()`;

        res.json({
            message: "Database connected successfully!",
            time: result[0].now
        });
    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            message: "Database connection failed."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});