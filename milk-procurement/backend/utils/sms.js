const twilio = require('twilio');
require('dotenv').config();

// Validate environment variables
const validateTwilioConfig = () => {
    const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        throw new Error(`Missing required Twilio configuration: ${missingVars.join(', ')}`);
    }

    if (!process.env.TWILIO_PHONE_NUMBER.startsWith('+')) {
        throw new Error('TWILIO_PHONE_NUMBER must start with + and include country code');
    }
};

// Initialize Twilio client with validation
let client;
try {
    validateTwilioConfig();
    client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );
} catch (error) {
    console.error('Twilio configuration error:', error.message);
    // Don't throw here, let the sendMilkRecordSMS function handle the error
}

const sendMilkRecordSMS = async (phoneNumber, record) => {
    try {
        // Validate Twilio configuration
        if (!client) {
            throw new Error('Twilio client not properly initialized');
        }

        // Format phone number
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
        
        console.log('Sending SMS to:', formattedPhone);
        console.log('Using Twilio number:', process.env.TWILIO_PHONE_NUMBER);

        const message = await client.messages.create({
            body: `Dear Farmer,\nYour milk record for ${new Date(record.date).toLocaleDateString()}:\nSession: ${record.session}\nFat: ${record.fat_content}%\nQuantity: ${record.quantity}L\nPrice/L: Rs.${record.price}\nTotal Amount: Rs.${record.total_amount}\n\nThank you for your business!`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhone
        });

        console.log('SMS sent successfully. Message SID:', message.sid);
        return {
            success: true,
            messageId: message.sid
        };
    } catch (error) {
        console.error('Error sending SMS:', {
            error: error.message,
            code: error.code,
            moreInfo: error.moreInfo
        });
        
        return {
            success: false,
            error: error.message,
            code: error.code,
            moreInfo: error.moreInfo
        };
    }
};

module.exports = {
    sendMilkRecordSMS
}; 