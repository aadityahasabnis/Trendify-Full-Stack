import jwt from 'jsonwebtoken';

export const isAuth = (req, res, next) => {
    try {
        const token = req.headers.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Not authorized, no token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
};

export const isAdmin = (req, res, next) => {
    try {
        const token = req.headers.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Not authorized, no token" });
        }

        // Try to decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if this is a user token with isAdmin property
        if (decoded.id && decoded.isAdmin) {
            req.user = decoded;
            next();
            return;
        }

        // Check if this is the admin token (email+password)
        if (decoded === process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            req.user = { isAdmin: true };
            next();
            return;
        }

        // If we get here, the token is valid but not for an admin
        return res.status(403).json({ success: false, message: "Not authorized as admin" });
    } catch (error) {
        console.error("Admin auth middleware error:", error);
        return res.status(403).json({ success: false, message: "Admin authorization failed" });
    }
}; 