import mongoose from "mongoose"
import {config} from "./env.js"

export const connectDB =async () =>{
  try{
  await mongoose.connect(config.MONGO_URI, { family: 4 })
  console.log("database connected")
  }catch(error){
    console.log("DATABASE CONNECTION ERROR: ",error);
    process.exit(1)
  }
}