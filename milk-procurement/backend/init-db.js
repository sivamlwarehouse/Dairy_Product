const db = require('./db');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
    try {
        // Create default buyer account
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.run(
            'INSERT OR IGNORE INTO buyers (username, password) VALUES (?, ?)',
            ['admin', hashedPassword],
            function(err) {
                if (err) {
                    console.error('Error creating default buyer account:', err);
                } else {
                    console.log('Default buyer account created or already exists');
                }
            }
        );
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

initializeDatabase(); 