const { pool } = require('../config/database');

class SystemLogger {
    // Log system actions
    static async log(action, description, userType = 'system', userId = null) {
        try {
            await pool.execute(
                'INSERT INTO system_logs (action, description, user_type, user_id) VALUES (?, ?, ?, ?)',
                [action, description, userType, userId]
            );
            
            // Also log to console for development
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${userType.toUpperCase()}: ${action} - ${description}`);
        } catch (error) {
            console.error('Error logging to database:', error);
            // Fallback to console logging
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${userType.toUpperCase()}: ${action} - ${description}`);
        }
    }

    // Get system logs with pagination
    static async getLogs(page = 1, limit = 50, userType = null) {
        try {
            const offset = (page - 1) * limit;
            let query = 'SELECT * FROM system_logs';
            let params = [];

            if (userType) {
                query += ' WHERE user_type = ?';
                params.push(userType);
            }

            query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);

            // Get total count for pagination
            let countQuery = 'SELECT COUNT(*) as total FROM system_logs';
            let countParams = [];

            if (userType) {
                countQuery += ' WHERE user_type = ?';
                countParams.push(userType);
            }

            const [countResult] = await pool.execute(countQuery, countParams);
            const total = countResult[0].total;

            return {
                logs: rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting logs:', error);
            throw error;
        }
    }

    // Clear old logs (older than specified days)
    static async clearOldLogs(days = 30) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM system_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)',
                [days]
            );
            
            const deletedCount = result.affectedRows;
            await this.log('SYSTEM_MAINTENANCE', `Cleared ${deletedCount} old log entries (older than ${days} days)`);
            
            return deletedCount;
        } catch (error) {
            console.error('Error clearing old logs:', error);
            throw error;
        }
    }

    // Get system statistics
    static async getSystemStats() {
        try {
            const [ticketStats] = await pool.execute(`
                SELECT 
                    COUNT(*) as total_tickets,
                    SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_tickets,
                    SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold_tickets
                FROM tickets
            `);

            const [vendorStats] = await pool.execute(`
                SELECT 
                    COUNT(*) as total_vendors,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_vendors
                FROM vendors
            `);

            const [customerStats] = await pool.execute(`
                SELECT 
                    COUNT(*) as total_customers,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_customers
                FROM customers
            `);

            const [recentActivity] = await pool.execute(`
                SELECT COUNT(*) as recent_actions
                FROM system_logs 
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            `);

            return {
                tickets: ticketStats[0],
                vendors: vendorStats[0],
                customers: customerStats[0],
                recentActivity: recentActivity[0].recent_actions,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting system stats:', error);
            throw error;
        }
    }
}

module.exports = SystemLogger;