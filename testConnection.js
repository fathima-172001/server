import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('URI:', process.env.MONGO_URI);
        
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
        
        // Test the connection by listing databases
        const adminDb = conn.connection.db.admin();
        const result = await adminDb.listDatabases();
        console.log('Available databases:', result.databases.map(db => db.name));
        
        await mongoose.connection.close();
        console.log('Connection closed successfully');
    } catch (error) {
        console.error('Connection error:', error);
    }
}

testConnection(); 