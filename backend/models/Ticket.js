const { pool } = require('../config/database');

class Ticket {
    constructor(ticketNumber, vendorId, price = 50.00) {
        this.ticketNumber = ticketNumber;
        this.vendorId = vendorId;
        this.price = price;
    }

    // Add tickets to the pool
    static async addTickets(tickets) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            const insertPromises = tickets.map(ticket => {
                return connection.execute(
                    'INSERT INTO tickets (ticket_number, vendor_id, price) VALUES (?, ?, ?)',
                    [ticket.ticketNumber, ticket.vendorId, ticket.price]
                );
            });

            await Promise.all(insertPromises);
            await connection.commit();
            
            console.log(`✅ Added ${tickets.length} tickets to pool`);
            return true;
        } catch (error) {
            await connection.rollback();
            console.error('Error adding tickets:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get available tickets count
    static async getAvailableCount() {
        try {
            const [rows] = await pool.execute(
                'SELECT COUNT(*) as count FROM tickets WHERE status = "available"'
            );
            return rows[0].count;
        } catch (error) {
            console.error('Error getting available tickets count:', error);
            throw error;
        }
    }

    // Purchase a ticket
    static async purchaseTicket(customerId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Find an available ticket
            const [tickets] = await connection.execute(
                'SELECT id, ticket_number FROM tickets WHERE status = "available" LIMIT 1 FOR UPDATE'
            );

            if (tickets.length === 0) {
                await connection.rollback();
                return null; // No tickets available
            }

            const ticket = tickets[0];

            // Update ticket status
            await connection.execute(
                'UPDATE tickets SET status = "sold", customer_id = ?, sold_at = NOW() WHERE id = ?',
                [customerId, ticket.id]
            );

            await connection.commit();
            console.log(`🎫 Ticket ${ticket.ticket_number} sold to customer ${customerId}`);
            return ticket;
        } catch (error) {
            await connection.rollback();
            console.error('Error purchasing ticket:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get all tickets with details
    static async getAllTickets() {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    t.id, 
                    t.ticket_number, 
                    t.status, 
                    t.price,
                    t.created_at,
                    t.sold_at,
                    v.name as vendor_name,
                    c.name as customer_name
                FROM tickets t
                LEFT JOIN vendors v ON t.vendor_id = v.id
                LEFT JOIN customers c ON t.customer_id = c.id
                ORDER BY t.created_at DESC
            `);
            return rows;
        } catch (error) {
            console.error('Error getting all tickets:', error);
            throw error;
        }
    }
}

module.exports = Ticket;