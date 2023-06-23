import mongoose from "mongoose";

/*
 schema is a blueprint or structure that defines the shape of documents within a 
 collection. It defines the fields, types, and constraints for the data stored in 
 MongoDB. 
*/


const FileSchema = mongoose.Schema({
    picture:{
        type:File,
        default:[]
    }
})

export const FileData = mongoose.model("FileData",FileSchema);