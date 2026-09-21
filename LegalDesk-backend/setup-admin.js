const sql = require("./db");

async function setupAdminTable() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS admin_users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log("Admin users table created successfully!");
    } catch (error) {
        console.error("Admin table setup failed:", error);
    }
}

setupAdminTable();