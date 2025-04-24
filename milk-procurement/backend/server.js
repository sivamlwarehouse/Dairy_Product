const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { sendMilkRecordSMS } = require('./utils/sms');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Farmer Registration
app.post('/api/farmers/register', async (req, res) => {
    const { name, phone, address, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            'INSERT INTO farmers (name, phone, address, password) VALUES (?, ?, ?, ?)',
            [name, phone, address, hashedPassword],
            function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        return res.status(400).json({ error: 'Phone number already registered' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                res.status(201).json({ id: this.lastID, message: 'Farmer registered successfully' });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all farmers
app.get('/api/farmers', (req, res) => {
    db.all('SELECT id, name, phone FROM farmers', (err, farmers) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error when fetching farmers' });
        }
        res.json(farmers);
    });
});

// Farmer Login
app.post('/api/farmers/login', async (req, res) => {
    const { phone, password } = req.body;
    
    db.get('SELECT * FROM farmers WHERE phone = ?', [phone], async (err, farmer) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!farmer) return res.status(401).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, farmer.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        res.json({ 
            id: farmer.id,
            name: farmer.name,
            message: 'Login successful' 
        });
    });
});

// Buyer login
app.post('/api/buyers/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM buyers WHERE username = ?', [username], async (err, buyer) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error during login' });
        }
        
        if (!buyer) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        try {
            const isMatch = await bcrypt.compare(password, buyer.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            res.json({
                id: buyer.id,
                username: buyer.username,
                message: 'Login successful'
            });
        } catch (err) {
            console.error('Password comparison error:', err);
            res.status(500).json({ error: 'Error during login' });
        }
    });
});

// Add milk record
app.post('/api/milk-records', (req, res) => {
    const { farmer_id, buyer_id, fat_content, quantity, session, send_sms = true } = req.body;
    
    // First get the price for the given fat content
    db.get(
        'SELECT price FROM fat_price WHERE fat_content <= ? ORDER BY fat_content DESC LIMIT 1',
        [fat_content],
        (err, priceRow) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error when fetching price' });
            }
            if (!priceRow) {
                return res.status(400).json({ error: 'Invalid fat content' });
            }

            const price = priceRow.price;
            const total_amount = price * quantity;

            // Get farmer's phone number only if SMS needs to be sent
            const getFarmerAndInsertRecord = () => {
                if (send_sms) {
                    db.get('SELECT phone FROM farmers WHERE id = ?', [farmer_id], handleFarmerAndRecord);
                } else {
                    // Skip getting farmer details and directly insert record
                    insertMilkRecord(null);
                }
            };

            const handleFarmerAndRecord = (err, farmer) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to fetch farmer details' });
                }
                insertMilkRecord(farmer);
            };

            const insertMilkRecord = (farmer) => {
                console.log('Inserting milk record for farmer:', farmer_id);
                db.run(
                    `INSERT INTO milk_records 
                    (farmer_id, buyer_id, fat_content, quantity, session, price, total_amount) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [farmer_id, buyer_id, fat_content, quantity, session, price, total_amount],
                    async function(err) {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({ error: 'Failed to add record' });
                        }

                        console.log('Record inserted successfully with ID:', this.lastID);
                        const record = {
                            id: this.lastID,
                            date: new Date(),
                            farmer_id,
                            buyer_id,
                            fat_content,
                            quantity,
                            session,
                            price,
                            total_amount
                        };

                        if (send_sms && farmer) {
                            console.log('Attempting to send SMS to farmer:', farmer.phone);
                            try {
                                await sendMilkRecordSMS(farmer.phone, record);
                                console.log('SMS sent successfully to:', farmer.phone);
                                res.status(201).json({ 
                                    id: this.lastID,
                                    price: price,
                                    totalAmount: total_amount,
                                    message: 'Record added successfully and SMS sent',
                                    smsStatus: 'sent'
                                });
                            } catch (smsError) {
                                console.error('SMS Error:', smsError);
                                res.status(201).json({ 
                                    id: this.lastID,
                                    price: price,
                                    totalAmount: total_amount,
                                    message: 'Record added successfully but SMS failed',
                                    smsStatus: 'failed',
                                    smsError: smsError.message
                                });
                            }
                        } else {
                            console.log('SMS not requested for record:', this.lastID);
                            res.status(201).json({ 
                                id: this.lastID,
                                price: price,
                                totalAmount: total_amount,
                                message: 'Record added successfully (SMS not requested)',
                                smsStatus: 'not_requested'
                            });
                        }
                    }
                );
            };

            getFarmerAndInsertRecord();
        }
    );
});

// Get farmer's milk records
app.get('/api/farmers/:id/milk-records', (req, res) => {
    const farmerId = req.params.id;
    console.log('Fetching records for farmer:', farmerId);

    db.all(
        `SELECT 
            m.*,
            f.name as farmer_name,
            b.username as buyer_name
        FROM milk_records m
        JOIN farmers f ON m.farmer_id = f.id
        JOIN buyers b ON m.buyer_id = b.id
        WHERE m.farmer_id = ?
        ORDER BY m.date DESC`,
        [farmerId],
        (err, records) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error when fetching records' });
            }
            console.log('Records found:', records?.length || 0);
            res.json(records || []);
        }
    );
});

// Get fat price table
app.get('/api/fat-prices', (req, res) => {
    db.all('SELECT * FROM fat_price ORDER BY fat_content', [], (err, prices) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(prices);
    });
});

// Get all milk records (for buyer dashboard)
app.get('/api/milk-records', (req, res) => {
    db.all(
        `SELECT 
            m.*,
            f.name as farmer_name,
            b.username as buyer_name
        FROM milk_records m
        JOIN farmers f ON m.farmer_id = f.id
        JOIN buyers b ON m.buyer_id = b.id
        ORDER BY m.date DESC`,
        [],
        (err, records) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error when fetching records' });
            }
            res.json(records || []);
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 