const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class Vendor {
    constructor(name, email, password, ticketsPerRelease = 5, releaseInterval = 1000) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.ticketsPerRelease = ticketsPerRelease;
        this.releaseInterval = releaseInterval;
    }

    // Create a new vendor
    async save() {
        try {
            const hashedPassword = await bcrypt.hash(this.password, 12);
            const [result] = await pool.execute(
                'INSERT INTO vendors (name, email, password, tickets_per_release, release_interval) VALUES (?, ?, ?, ?, ?)',
                [this.name, this.email, hashedPassword, this.ticketsPerRelease, this.releaseInterval]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating vendor:', error);
            throw error;
        }
    }

    // Find vendor by email
    static async findByEmail(email) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM vendors WHERE email = ?',
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error finding vendor by email:', error);
            throw error;
        }
    }

    // Get all vendors
    static async findAll() {
        try {
            const [rows] = await pool.execute(
                'SELECT id, name, email, tickets_per_release, release_interval, is_active, created_at FROM vendors'
            );
            return rows;
        } catch (error) {
            console.error('Error getting all vendors:', error);
            throw error;
        }
    }

    // Validate password
    static async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = Vendor;