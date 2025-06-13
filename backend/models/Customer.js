const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class Customer {
    constructor(name, email, password, retrievalInterval = 2000, priorityLevel = 'standard') {
        this.name = name;
        this.email = email;
        this.password = password;
        this.retrievalInterval = retrievalInterval;
        this.priorityLevel = priorityLevel;
    }

    // Create a new customer
    async save() {
        try {
            const hashedPassword = await bcrypt.hash(this.password, 12);
            const [result] = await pool.execute(
                'INSERT INTO customers (name, email, password, retrieval_interval, priority_level) VALUES (?, ?, ?, ?, ?)',
                [this.name, this.email, hashedPassword, this.retrievalInterval, this.priorityLevel]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating customer:', error);
            throw error;
        }
    }

    // Find customer by email
    static async findByEmail(email) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM customers WHERE email = ?',
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error finding customer by email:', error);
            throw error;
        }
    }

    // Find customer by ID
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT id, name, email, retrieval_interval, priority_level, is_active, created_at FROM customers WHERE id = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error finding customer by ID:', error);
            throw error;
        }
    }

    // Get all customers
    static async findAll() {
        try {
            const [rows] = await pool.execute(
                'SELECT id, name, email, retrieval_interval, priority_level, is_active, created_at FROM customers'
            );
            return rows;
        } catch (error) {
            console.error('Error getting all customers:', error);
            throw error;
        }
    }

    // Get customer's purchased tickets
    static async getPurchasedTickets(customerId) {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    t.id,
                    t.ticket_number,
                    t.price,
                    t.sold_at,
                    v.name as vendor_name
                FROM tickets t
                JOIN vendors v ON t.vendor_id = v.id
                WHERE t.customer_id = ? AND t.status = 'sold'
                ORDER BY t.sold_at DESC
            `, [customerId]);
            return rows;
        } catch (error) {
            console.error('Error getting customer tickets:', error);
            throw error;
        }
    }

    // Validate password
    static async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Update customer activity status
    static async updateActivityStatus(customerId, isActive) {
        try {
            await pool.execute(
                'UPDATE customers SET is_active = ? WHERE id = ?',
                [isActive, customerId]
            );
        } catch (error) {
            console.error('Error updating customer activity:', error);
            throw error;
        }
    }
}

module.exports = Customer;