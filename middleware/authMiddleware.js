const jwt = require('jsonwebtoken'); 
const User = require('../models/userModel'); 

const protect = async (req, res, next) => {
    let token;

    // 1. التحقق من وجود Authorization Header وصيغته (Bearer Token)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // جلب قيمة Token
            token = req.headers.authorization.split(' ')[1];

            // 2. فك تشفير الـ Token والتحقق من صلاحيته
            const decoded = jwt.verify(token, process.env.JWT_SECRET); 

            // 3. البحث عن المستخدم وإضافته لـ req
            // نفترض أن الـ Token يحتوي على id المستخدم
            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(401).json({ error: 'Not authorized, user not found' });
            }

            // إضافة بيانات المستخدم لكي تكون متاحة في الـ Controllers
            req.user = user;
            req.user.id = user.user_id; // لتسهيل الوصول إليه باسم req.user.id

            next(); // الاستمرار إلى الـ Controller
        } catch (error) {
            console.error('JWT Verification Error:', error.message);
            // إذا فشل فك التشفير أو انتهت صلاحية الـ Token
            return res.status(401).json({ error: 'Not authorized, token failed or expired' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token provided' });
    }
};

module.exports = { protect };