import mongoose from "mongoose"

let cached = global.mongoose;

if(!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
    if(cached.conn) return cached.conn;

    if(!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 1,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        }).then((mongoose) => {
            console.log("MongoDB connected");
            return mongoose;
        }).catch((err) => {
            console.error("MongoDB Connection Error: " + err);
            throw err;
        });
    }
    
    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (err) {
        cached.conn = null;
        cached.promise = null; // Fixed typo: was "promised"
        throw err;
    }
}