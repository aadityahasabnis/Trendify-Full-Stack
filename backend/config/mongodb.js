import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log("MongoDB Connected Successfully");
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB Connection Error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB Disconnected');
        });

        const dbUri = `${process.env.MONGODB_URL}/trendify`;
        console.log("Attempting to connect to MongoDB at:", dbUri);
        await mongoose.connect(dbUri);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

export default connectDB;