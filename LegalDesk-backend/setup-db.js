const sql = require("./db");

async function setupDatabase() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS blogs (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                excerpt TEXT,
                content TEXT NOT NULL,
                category VARCHAR(100),
                cover_image TEXT,
                author VARCHAR(150) DEFAULT 'Adv. Samridhi Sharma',
                published BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log("Blogs table created successfully!");
    } catch (error) {
        console.error("Database setup failed:", error);
    }
}

setupDatabase();