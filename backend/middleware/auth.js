const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');
const Customer = require('../models/Customer');

// Generate JWT token
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '24h'
    });
};

// Verify JWT token
const verifyToken = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }
        
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// Check if user is vendor
const isVendor = (req, res, next) => {
    if (req.user.userType !== 'vendor') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Vendor permissions required.'
        });
    }
    next();
};

// Check if user is customer
const isCustomer = (req, res, next) => {
    if (req.user.userType !== 'customer') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Customer permissions required.'
        });
    }
    next();
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        }
        
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

// Validate user exists in database
const validateUser = async (req, res, next) => {
    try {
        const { userId, userType } = req.user;
        
        let user;
        if (userType === 'vendor') {
            user = await Vendor.findById(userId);
        } else if (userType === 'customer') {
            user = await Customer.findById(userId);
        }
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Please login again.'
            });
        }
        
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }
        
        req.userDetails = user;
        next();
    } catch (error) {
        console.error('Error validating user:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during user validation.'
        });
    }
};

module.exports = {
    generateToken,
    verifyToken,
    isVendor,
    isCustomer,
    optionalAuth,
    validateUser
};