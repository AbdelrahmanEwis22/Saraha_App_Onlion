import mongoose from 'mongoose'
const connectDB = async()=>{
    try {
        const uri = process.env.DB_URI;
        const result = await mongoose.connect(uri,{
            serverSelectionTimeoutMS: 30000
        })
        // console.log(result.models);
        console.log(`Db Connected Successfully`);
    } catch (error) {
        console.log(`Fail to connect on Db `,error);
    }
}
export default connectDB