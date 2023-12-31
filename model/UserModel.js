import mongoose from "mongoose";

//A schema is a JSON object that defines the the structure and contents of your data.
// create collection field structure

const UserSchema = mongoose.Schema({
  Name: {
    type: String,
    required: true,
    min:2,
    max:50
  },

  Email: {
    type: String,
    required: true,
    unique: true,
    match: /^\S+@\S+\.\S+$/,
    max:50
  },

  Password: {
    type: String,
    required: true,
    min: 6,
  },

  picturePath:{
    type: String,
    default:null,
  },

  friends:{
    type: Array,
    default:[]
  },

  friendRequests: {
    type: Array,
    default: []
  },

  location: {
    type: String,
    default:null
  },
  about:{
    type: String,
    default:null
  },
  viewedProfile: Number,
  impressions: Number,
  

  blogs: [
    { 
      type: mongoose.Types.ObjectId, 
      ref: "BlogData", // foreign key ref to BlogData model
      required: true 
    }
  ],

},
{timestamps:true});

const UserData = mongoose.model("UserData", UserSchema);
export default UserData;

//UserData - db collection name.

// initially
//{
//   _id: 59ab1c92ea84486fb4ba9f28,
//   Name: JD,
//   blogs: []
// }

// after adding blog
//{
//   _id: 59ab1c92ea84486fb4ba9f28,
//   Name: JD,
//   blogs: [
//     "59ab1b43ea84486fb4ba9ef0",
//     "59ab1b43ea84486fb4ba9ef1"
//   ]
// }
