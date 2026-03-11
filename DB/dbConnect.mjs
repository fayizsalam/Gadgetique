import mongoose from "mongoose";

const dbConnect = async () => {
    try {
        
        const connect= await mongoose.connect(process.env.MONGO_URI);
        console.log(`DB connected Succesfully`);
        
    } catch (error) {
        console.error(`DB connection Error: ${error}`);
    }
    
}



export default dbConnect;