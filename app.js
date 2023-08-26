import express from "express";
import mongoose from "mongoose";
import blogRouter from "./urls/blog-urls";
import userRouter from "./urls/user-urls";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv/config";
import morgan from "morgan";
import multer from "multer";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import {
  refreshToken,
  updateProfileImage,
  verifyToken,
} from "./controllers/user-controller";
import { addBlog, updateBlog } from "./controllers/blog-controller";

import { GridFSBucket } from 'mongodb';


// CONFIGURATIONS TO STORE FILES IN FOLDER
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// initialize express
const app = express();

// middle-wares
// Allow all origins and include credentials (only for development)
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);
app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// serve static files
app.use("/public", express.static(path.join(__dirname, "public")));

// local FILE STORAGE with multer
// Multer: It is a middleware for handling multipart/form-data, which is commonly used for file uploads. It allows you to handle the file upload process easily.
// Define the multer storage and file upload settings. storing files in project folder

// handle storing files
// const storage = multer.diskStorage({
//   // Destination folder for uploaded files
//   destination: function (req,file, cb) {
//     cb(null, "public/assets");
//   },

//   // Filename for uploaded files
//   filename: function (req,file, cb) {
//     const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//     const filename = `${uniqueSuffix}-${file.originalname}`;

//     cb(null, filename); // Set the filename for the uploaded file
//   },
// });
// // Initialize multer with the storage settings

// const upload = multer({ storage });

// requests for retrieving and serving the image file
// app.get("/api/blog/image/:filename", (req, res) => {
//   try {
//     const filename = req.params.filename;
//     const imagePath = path.join(__dirname, "public/assets", filename);

//     res.sendFile(imagePath);
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// });


// FILE STORAGE WITH mongoose GRIDFS
// storing files in mongoDB file storage system

// Import necessary modules and libraries
const connection = mongoose.connection; // Mongoose connection instance
let gfs; // GridFSBucket instance

// Set up a one-time event listener for when the MongoDB connection is open
connection.once('open', () => {
  // Initialize GridFS stream using the open connection's database
  gfs = new GridFSBucket(connection.db, { bucketName: 'uploads' });
});

// Set up multer storage for handling file uploads
const storage = multer.memoryStorage(); // Store files in memory for processing
const upload = multer({ storage }); // Initialize multer with the specified storage


// Define a route to retrieve and stream files from GridFS
app.get('/api/blog/image/:fileId', (req, res) => {
  try {
    const fileId = req.params.fileId;

    // Read file from GridFS and stream it to the response
    const readStream = gfs.openDownloadStream(new mongoose.Types.ObjectId(fileId));

    // Set up an error event listener for the read stream
    readStream.on('error', (error) => {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred' });
    });

    // Pipe the read stream to the response object to send the file to the client
    readStream.pipe(res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'An error occurred' });
  }
});


// this routes should be present here because of image upload
app.post("/api/blog/addBlog",refreshToken,verifyToken,upload.single("image"),addBlog);
app.put("/api/blog/updateBlog/:blogId", refreshToken, verifyToken, upload.single("image"),updateBlog);
app.put("/api/user/updateProfileImage/:userId",refreshToken, verifyToken,upload.single("picturePath"), updateProfileImage);


app.use("/api/user", userRouter);
app.use("/api/blog", blogRouter);

// connect server db
const mongoURI = process.env.MYDB_CONNECTION;
const port = process.env.PORT || 5001;

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => app.listen(port))
  .then(() => {
    console.log(`Connected DB and Listening Localhost ${port}`);
    // UserData.insertMany(users) // users => {} directly including bulk data
  })
  .catch((err) => console.log(`${err} did not connect`));


  


// node js is open source server environment is used to run js on server
// node js has its own http methods.
// express is a web framework is used to create RESTful apis. runs top of node js
export default app;
