const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database(path.join(__dirname, 'milk_procurement.db'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Create tables
        db.serialize(() => {
            // Enable foreign key support
            db.run('PRAGMA foreign_keys = ON');

            // Farmers table
            db.run(`CREATE TABLE IF NOT EXISTS farmers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT UNIQUE NOT NULL,
                address TEXT,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Create index on phone number
            db.run('CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone)');

            // Buyers table
            db.run(`CREATE TABLE IF NOT EXISTS buyers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Create index on username
            db.run('CREATE INDEX IF NOT EXISTS idx_buyers_username ON buyers(username)');

            // Fat price table
            db.run(`CREATE TABLE IF NOT EXISTS fat_price (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fat_content REAL UNIQUE NOT NULL,
                price REAL NOT NULL CHECK (price > 0),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Create index on fat content
            db.run('CREATE INDEX IF NOT EXISTS idx_fat_price_content ON fat_price(fat_content)');

            // Milk records table with price calculation fields
            db.run(`CREATE TABLE IF NOT EXISTS milk_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                farmer_id INTEGER NOT NULL,
                buyer_id INTEGER NOT NULL,
                fat_content REAL NOT NULL CHECK (fat_content BETWEEN 5.0 AND 10.0),
                quantity REAL NOT NULL CHECK (quantity > 0),
                session TEXT NOT NULL CHECK (session IN ('AM', 'PM')),
                price REAL NOT NULL CHECK (price > 0),
                total_amount REAL NOT NULL CHECK (total_amount > 0),
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (farmer_id) REFERENCES farmers (id) ON DELETE CASCADE,
                FOREIGN KEY (buyer_id) REFERENCES buyers (id) ON DELETE CASCADE
            )`);

            // Create indexes for milk_records
            db.run('CREATE INDEX IF NOT EXISTS idx_milk_records_farmer ON milk_records(farmer_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_milk_records_buyer ON milk_records(buyer_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_milk_records_date ON milk_records(date)');

            // Insert default buyer if not exists
            bcrypt.hash('admin123', 10, (err, hash) => {
                if (err) {
                    console.error('Error hashing password:', err);
                    return;
                }
                db.run(
                    'INSERT OR IGNORE INTO buyers (username, password) VALUES (?, ?)',
                    ['admin', hash],
                    (err) => {
                        if (err) {
                            console.error('Error inserting default buyer:', err);
                        } else {
                            console.log('Default buyer account created or already exists');
                            // Log the default credentials
                            console.log('Default buyer credentials:');
                            console.log('Username: admin');
                            console.log('Password: admin123');
                        }
                    }
                );
            });

            // Insert default fat prices if not exists
            const fatPrices = [
                { fat_content: 5.0, price: 37.00 },
                { fat_content: 5.1, price: 37.74 },
                { fat_content: 5.2, price: 38.48 },
                { fat_content: 5.3, price: 39.22 },
                { fat_content: 5.4, price: 39.96 },
                { fat_content: 5.5, price: 40.70 },
                { fat_content: 5.6, price: 41.44 },
                { fat_content: 5.7, price: 42.18 },
                { fat_content: 5.8, price: 42.92 },
                { fat_content: 5.9, price: 43.66 },
                { fat_content: 6.0, price: 44.40 },
                { fat_content: 6.1, price: 45.14 },
                { fat_content: 6.2, price: 45.88 },
                { fat_content: 6.3, price: 46.62 },
                { fat_content: 6.4, price: 47.36 },
                { fat_content: 6.5, price: 48.10 },
                { fat_content: 6.6, price: 48.84 },
                { fat_content: 6.7, price: 49.58 },
                { fat_content: 6.8, price: 50.32 },
                { fat_content: 6.9, price: 51.06 },
                { fat_content: 7.0, price: 51.80 },
                { fat_content: 7.1, price: 52.54 },
                { fat_content: 7.2, price: 53.28 },
                { fat_content: 7.3, price: 54.02 },
                { fat_content: 7.4, price: 54.76 },
                { fat_content: 7.5, price: 55.50 },
                { fat_content: 7.6, price: 56.24 },
                { fat_content: 7.7, price: 56.98 },
                { fat_content: 7.8, price: 57.72 },
                { fat_content: 7.9, price: 58.46 },
                { fat_content: 8.0, price: 59.20 },
                { fat_content: 8.1, price: 59.94 },
                { fat_content: 8.2, price: 60.68 },
                { fat_content: 8.3, price: 61.42 },
                { fat_content: 8.4, price: 62.16 },
                { fat_content: 8.5, price: 62.90 },
                { fat_content: 8.6, price: 63.64 },
                { fat_content: 8.7, price: 64.38 },
                { fat_content: 8.8, price: 65.12 },
                { fat_content: 8.9, price: 65.86 },
                { fat_content: 9.0, price: 66.60 },
                { fat_content: 9.1, price: 67.34 },
                { fat_content: 9.2, price: 68.08 },
                { fat_content: 9.3, price: 68.82 },
                { fat_content: 9.4, price: 69.56 },
                { fat_content: 9.5, price: 70.30 },
                { fat_content: 9.6, price: 71.04 },
                { fat_content: 9.7, price: 71.78 },
                { fat_content: 9.8, price: 72.52 },
                { fat_content: 9.9, price: 73.26 },
                { fat_content: 10.0, price: 74.00 }
            ];

            // Clear existing fat prices and insert new ones
            db.run('DELETE FROM fat_price', [], (err) => {
                if (err) {
                    console.error('Error clearing fat price table:', err);
                    return;
                }
                console.log('Fat price table cleared successfully');

                const stmt = db.prepare('INSERT INTO fat_price (fat_content, price) VALUES (?, ?)');
                fatPrices.forEach(({ fat_content, price }) => {
                    stmt.run(fat_content, price);
                });
                stmt.finalize();
                console.log('New fat prices inserted successfully');
            });

            console.log('Database schema and initial data setup completed');
        });
    }
});

module.exports = db; 