const express = require("express");
const dotenv = require("dotenv");
const { neon } = require("@neondatabase/serverless");

dotenv.config();

const app = express();
const PORT = 5000;

const sql = neon(process.env.DATABASE_URL);

// Home route
app.get("/", (req, res) => {
    res.send("LegalDesk backend is running!");
});

// Get all published blogs
app.get("/api/blogs", async (req, res) => {
    try {
        const blogs = await sql`
            SELECT *
            FROM blogs
            WHERE published = true
            ORDER BY created_at DESC
        `;

        res.json(blogs);
    } catch (error) {
        console.error("Error fetching blogs:", error);

        res.status(500).json({
            message: "Failed to fetch blogs."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});