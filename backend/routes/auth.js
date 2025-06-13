const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const Customer = require('../models/Customer');
const { generateToken } = require('../middleware/auth');
const SystemLogger = require('../utils/logger');

// Vendor Registration
router.post('/vendor/register', async (req, res) => {
    try {
        const { name, email, password, ticketsPerRelease, releaseInterval } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Check if vendor already exists
        const existingVendor = await Vendor.findByEmail(email);
        if (existingVendor) {
            return res.status(409).json({
                success: false,
                message: 'Vendor with this email already exists'
            });
        }

        // Create new vendor
        const vendor = new Vendor(name, email, password, ticketsPerRelease, releaseInterval);
        const vendorId = await vendor.save();

        // Log the registration
        await SystemLogger.log('VENDOR_REGISTERED', `New vendor registered: ${email}`, 'vendor', vendorId);

        res.status(201).json({
            success: true,
            message: 'Vendor registered successfully',
            vendorId
        });

    } catch (error) {
        console.error('Vendor registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
});

// Customer Registration
router.post('/customer/register', async (req, res) => {
    try {
        const { name, email, password, retrievalInterval, priorityLevel } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Check if customer already exists
        const existingCustomer = await Customer.findByEmail(email);
        if (existingCustomer) {
            return res.status(409).json({
                success: false,
                message: 'Customer with this email already exists'
            });
        }

        // Create new customer
        const customer = new Customer(name, email, password, retrievalInterval, priorityLevel);
        const customerId = await customer.save();

        // Log the registration
        await SystemLogger.log('CUSTOMER_REGISTERED', `New customer registered: ${email}`, 'customer', customerId);

        res.status(201).json({
            success: true,
            message: 'Customer registered successfully',
            customerId
        });

    } catch (error) {
        console.error('Customer registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
});

// Vendor Login
router.post('/vendor/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find vendor
        const vendor = await Vendor.findByEmail(email);
        if (!vendor) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const isValidPassword = await Vendor.validatePassword(password, vendor.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if vendor is active
        if (!vendor.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Generate token
        const token = generateToken({
            userId: vendor.id,
            email: vendor.email,
            userType: 'vendor'
        });

        // Log the login
        await SystemLogger.log('VENDOR_LOGIN', `Vendor logged in: ${email}`, 'vendor', vendor.id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: vendor.id,
                name: vendor.name,
                email: vendor.email,
                userType: 'vendor',
                ticketsPerRelease: vendor.tickets_per_release,
                releaseInterval: vendor.release_interval
            }
        });

    } catch (error) {
        console.error('Vendor login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
});

// Customer Login
router.post('/customer/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find customer
        const customer = await Customer.findByEmail(email);
        if (!customer) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const isValidPassword = await Customer.validatePassword(password, customer.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if customer is active
        if (!customer.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Generate token
        const token = generateToken({
            userId: customer.id,
            email: customer.email,
            userType: 'customer'
        });

        // Log the login
        await SystemLogger.log('CUSTOMER_LOGIN', `Customer logged in: ${email}`, 'customer', customer.id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                userType: 'customer',
                retrievalInterval: customer.retrieval_interval,
                priorityLevel: customer.priority_level
            }
        });

    } catch (error) {
        console.error('Customer login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
});

module.exports = router;