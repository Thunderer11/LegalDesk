const express = require("express");
const dotenv = require("dotenv");
const { neon } = require("@neondatabase/serverless");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middleware/authMiddleware");
const cors = require("cors");
const sanitizeHtml = require("sanitize-html");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    "https://www.advsamridhisharma.com",
    "http://127.0.0.1:5500",
    "http://localhost:5500"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

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
app.get("/api/blogs/:slug", async (req, res) => {
    try {
        const { slug } = req.params;

        const blogs = await sql`
            SELECT *
            FROM blogs
            WHERE slug = ${slug}
            AND published = true
        `;

        if (blogs.length === 0) {
            return res.status(404).json({
                message: "Blog not found."
            });
        }

        res.json(blogs[0]);

    } catch (error) {
        console.error("Error fetching blog:", error);

        res.status(500).json({
            message: "Failed to fetch blog."
        });
    }
});
app.post("/api/blogs", authMiddleware, async (req, res) => {
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
        const cleanContent = sanitizeHtml(content, {
        allowedTags: [
            "p",
            "br",
            "strong",
            "em",
            "u",
            "h1",
            "h2",
            "h3",
            "h4",
            "blockquote",
            "ul",
            "ol",
            "li",
            "a"
        ],
        allowedAttributes: {
            a: ["href", "target", "rel"]
        },
        allowedSchemes: ["http", "https", "mailto"]
    });

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
                ${cleanContent},
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
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const admins = await sql`
            SELECT *
            FROM admin_users
            WHERE email = ${email}
        `;

        if (admins.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const admin = admins[0];

        const passwordMatch = await bcrypt.compare(
            password,
            admin.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            {
                adminId: admin.id,
                email: admin.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        res.cookie("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
            maxAge: 2 * 60 * 60 * 1000,
            path: "/"
        });

        res.json({
            message: "Login successful.",
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Login failed."
        });
    }
});
app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
        const admins = await sql`
            SELECT id, name, email
            FROM admin_users
            WHERE id = ${req.admin.adminId}
        `;

        if (admins.length === 0) {
            return res.status(401).json({
                message: "Admin not found."
            });
        }

        res.json({
            admin: admins[0]
        });

    } catch (error) {
        console.error("Auth check error:", error);

        res.status(500).json({
            message: "Failed to verify authentication."
        });
    }
});
app.get("/api/admin/blogs", authMiddleware, async (req, res) => {
    try {
        const blogs = await sql`
            SELECT *
            FROM blogs
            ORDER BY created_at DESC
        `;

        res.json(blogs);

    } catch (error) {
        console.error("Error fetching admin blogs:", error);

        res.status(500).json({
            message: "Failed to fetch blogs."
        });
    }
});
app.put("/api/blogs/:id", authMiddleware, async (req, res) => {
    try {
        const blogId = req.params.id;

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

        if (!title || !slug || !content) {
            return res.status(400).json({
                message: "Title, slug and content are required."
            });
        }

        const cleanContent = sanitizeHtml(content, {
            allowedTags: [
                "p",
                "br",
                "strong",
                "em",
                "u",
                "h1",
                "h2",
                "h3",
                "h4",
                "blockquote",
                "ul",
                "ol",
                "li",
                "a"
            ],
            allowedAttributes: {
                a: ["href", "target", "rel"]
            },
            allowedSchemes: ["http", "https", "mailto"]
        });

        const updatedBlog = await sql`
            UPDATE blogs
            SET
                title = ${title},
                slug = ${slug},
                excerpt = ${excerpt},
                content = ${cleanContent},
                category = ${category},
                cover_image = ${cover_image || null},
                author = ${author || "Adv. Samridhi Sharma"},
                published = ${published || false},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${blogId}
            RETURNING *
        `;

        if (updatedBlog.length === 0) {
            return res.status(404).json({
                message: "Blog not found."
            });
        }

        res.json(updatedBlog[0]);

    } catch (error) {
        console.error("Error updating blog:", error);

        res.status(500).json({
            message: "Failed to update blog."
        });
    }
});
app.delete("/api/blogs/:id", authMiddleware, async (req, res) => {
    try {
        const blogId = req.params.id;

        const deletedBlog = await sql`
            DELETE FROM blogs
            WHERE id = ${blogId}
            RETURNING id, title
        `;

        if (deletedBlog.length === 0) {
            return res.status(404).json({
                message: "Blog not found."
            });
        }

        res.json({
            message: "Blog deleted successfully.",
            blog: deletedBlog[0]
        });

    } catch (error) {
        console.error("Error deleting blog:", error);

        res.status(500).json({
            message: "Failed to delete blog."
        });
    }
});
app.patch("/api/blogs/:id/publish", authMiddleware, async (req, res) => {
    try {
        const blogId = req.params.id;
        const { published } = req.body;

        if (typeof published !== "boolean") {
            return res.status(400).json({
                message: "Published must be true or false."
            });
        }

        const updatedBlog = await sql`
            UPDATE blogs
            SET
                published = ${published},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${blogId}
            RETURNING id, title, published, updated_at
        `;

        if (updatedBlog.length === 0) {
            return res.status(404).json({
                message: "Blog not found."
            });
        }

        res.json({
            message: published
                ? "Blog published successfully."
                : "Blog unpublished successfully.",
            blog: updatedBlog[0]
        });

    } catch (error) {
        console.error("Error changing blog publication status:", error);

        res.status(500).json({
            message: "Failed to update publication status."
        });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});