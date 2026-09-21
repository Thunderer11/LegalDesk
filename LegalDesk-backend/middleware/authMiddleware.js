const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    try {
        const token = req.cookies.admin_token;

        if (!token) {
            return res.status(401).json({
                message: "Authentication required."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.admin = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired authentication."
        });
    }
}

module.exports = authMiddleware;