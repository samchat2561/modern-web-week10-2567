// getting-started.js
import mongoose from "mongoose";

export default async function connectMongoDB() {
    try {
        await mongoose.connect(process.env.MONGO_DB_URI)
        console.log("Connectd to MongoDB")
    } catch (error) {
        console.log(error)
    }
}