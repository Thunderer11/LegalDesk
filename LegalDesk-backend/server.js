const express = require("express");
const dotenv = require("dotenv");
const { neon } = require("@neondatabase/serverless");

dotenv.config();

const app = express();
const PORT = 5000;
app.use(express.json());

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
app.post("/api/blogs", async (req, res) => {
    try {
        const {
            title,
            slug,
            excerpt,
            content,
            category,
            cover_image,
            author,
            published
        } = req.body;

        const newBlog = await sql`
            INSERT INTO blogs (
                title,
                slug,
                excerpt,
                content,
                category,
                cover_image,
                author,
                published
            )
            VALUES (
                ${title},
                ${slug},
                ${excerpt},
                ${content},
                ${category},
                ${cover_image},
                ${author || "Adv. Samridhi Sharma"},
                ${published || false}
            )
            RETURNING *
        `;

        res.status(201).json(newBlog[0]);

    } catch (error) {
        console.error("Error creating blog:", error);

        res.status(500).json({
            message: "Failed to create blog."
        });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});