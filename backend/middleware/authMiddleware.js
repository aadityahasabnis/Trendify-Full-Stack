import jwt from 'jsonwebtoken';

/**
 * Regular user authentication middleware
 * Verifies the JWT token and adds user information to the request
 */
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

/**
 * Simple user authentication middleware (legacy version)
 * Compatible with existing routes that use this pattern
 */
export const authUser = async (req, res, next) => {
    try {
        const token = req.headers.token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id }; // Add user to request object
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

/**
 * Admin authentication middleware
 * Supports both admin-specific tokens and user tokens with admin privileges
 */
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

/**
 * Legacy admin authentication middleware
 * Kept for backward compatibility with existing routes
 */
export const adminAuth = async (req, res, next) => {
    try {
        const { token } = req.headers;
        if (!token) {
            return res.json({ success: false, message: "Not authorized Login again" });
        }
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            return res.json({ success: false, message: "Not authorized Login again" });
        }
        else {
            req.user = { isAdmin: true };
            next();
        }
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
    }
}; 