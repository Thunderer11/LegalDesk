const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const sql = require("./db");

dotenv.config();

async function createAdmin() {
    try {
        const name = process.env.ADMIN_NAME;
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!name || !email || !password) {
            throw new Error("Admin credentials are missing from .env");
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const admin = await sql`
            INSERT INTO admin_users (
                name,
                email,
                password_hash
            )
            VALUES (
                ${name},
                ${email},
                ${passwordHash}
            )
            RETURNING id, name, email, created_at
        `;

        console.log("Admin account created successfully!");
        console.log(admin[0]);

    } catch (error) {
        console.error("Failed to create admin:", error);
    }
}

createAdmin();