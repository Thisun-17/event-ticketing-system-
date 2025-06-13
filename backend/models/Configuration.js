const { pool } = require('../config/database');

class Configuration {
    constructor(totalTickets, ticketReleaseRate, customerRetrievalRate, maxTicketCapacity) {
        this.totalTickets = totalTickets;
        this.ticketReleaseRate = ticketReleaseRate;
        this.customerRetrievalRate = customerRetrievalRate;
        this.maxTicketCapacity = maxTicketCapacity;
    }

    // Save configuration
    async save() {
        try {
            const [result] = await pool.execute(
                'INSERT INTO configurations (total_tickets, ticket_release_rate, customer_retrieval_rate, max_ticket_capacity) VALUES (?, ?, ?, ?)',
                [this.totalTickets, this.ticketReleaseRate, this.customerRetrievalRate, this.maxTicketCapacity]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error saving configuration:', error);
            throw error;
        }
    }

    // Get current configuration
    static async getCurrent() {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM configurations ORDER BY created_at DESC LIMIT 1'
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error getting current configuration:', error);
            throw error;
        }
    }

    // Update configuration
    static async update(id, updates) {
        try {
            const fields = [];
            const values = [];
            
            Object.keys(updates).forEach(key => {
                if (updates[key] !== undefined) {
                    fields.push(`${key} = ?`);
                    values.push(updates[key]);
                }
            });
            
            if (fields.length === 0) {
                throw new Error('No fields to update');
            }
            
            values.push(id);
            
            const [result] = await pool.execute(
                `UPDATE configurations SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
                values
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating configuration:', error);
            throw error;
        }
    }

    // Get all configurations (for history)
    static async getAll() {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM configurations ORDER BY created_at DESC'
            );
            return rows;
        } catch (error) {
            console.error('Error getting all configurations:', error);
            throw error;
        }
    }

    // Validate configuration values
    static validate(config) {
        const errors = [];

        if (!config.totalTickets || config.totalTickets <= 0) {
            errors.push('Total tickets must be a positive number');
        }

        if (!config.ticketReleaseRate || config.ticketReleaseRate <= 0) {
            errors.push('Ticket release rate must be a positive number');
        }

        if (!config.customerRetrievalRate || config.customerRetrievalRate <= 0) {
            errors.push('Customer retrieval rate must be a positive number');
        }

        if (!config.maxTicketCapacity || config.maxTicketCapacity <= 0) {
            errors.push('Maximum ticket capacity must be a positive number');
        }

        if (config.maxTicketCapacity && config.totalTickets && config.maxTicketCapacity < config.totalTickets) {
            errors.push('Maximum ticket capacity cannot be less than total tickets');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = Configuration;