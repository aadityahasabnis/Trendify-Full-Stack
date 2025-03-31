import jwt from 'jsonwebtoken';
import { toast } from 'react-toastify';

const authUser = async (req, res, next) => {
    const { token } = req.headers;
    if (!token) {
        toast.error("Login First")
        return res.status(401).json({ success: false, message: "Non authorized Login again" });
    }

    try {

        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        req.body.userId = token_decode.id;
        next();
    } catch (error) {
        console.log(error);
        toast.error("Login First")
        return res.status(401).json({ success: false, message: "Non authorized Login again" });

    }
}

export default authUser;