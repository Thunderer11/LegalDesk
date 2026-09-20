const sql = require("./db");

async function createTestBlog() {
    try {
        await sql`
            INSERT INTO blogs (
                title,
                slug,
                excerpt,
                content,
                category,
                author,
                published
            )
            VALUES (
                'Understanding Cyber Law in India',
                'understanding-cyber-law-in-india',
                'A basic introduction to cyber law and digital offences in India.',
                '<p>This is a test blog post for the LegalDesk CMS.</p>',
                'Cyber Law',
                'Adv. Samridhi Sharma',
                true
            )
        `;

        console.log("Test blog created successfully!");
    } catch (error) {
        console.error("Failed to create test blog:", error);
    }
}

createTestBlog();