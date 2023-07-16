import express from "express";
import mongoose from "mongoose";
import blogRouter from "./routes/blog-routes";
import userRouter from "./routes/user-routes";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv/config";
import morgan from "morgan";
import multer from "multer";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import {
  refreshToken,
  signup,
  verifyToken,
} from "./controllers/user-controller";
import { addBlog, updateBlog } from "./controllers/blog-controller";
import UserData from "./model/UserModel";
import { createReadStream } from "fs";
import { GridFsStorage } from "multer-gridfs-storage";
import Grid from "gridfs-stream";
import crypto from "crypto";




// CONFIGURATIONS TO STORE FILES IN FOLDER
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// initialize express
const app = express();

// middle-waresa
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
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

// serve static files
app.use("/public", express.static(path.join(__dirname, "public")));

// FILE STORAGE WITH GRIDFS
// storing files in mongoDB file storage system
// Initialize GridFS
// const conn = mongoose.connection;
// let gfs;

// conn.once("open", () => {
//   // Initialize GridFS stream
//   gfs = Grid(conn.db, mongoose.mongo);

//   // Create storage engine for GridFS
//   const storage = new GridFsStorage({
//     url: mongoURI,
//     file: (req, file) => {
//       return new Promise((resolve, reject) => {
//         crypto.randomBytes(16, (err, buf) => {
//           if (err) {
//             return reject(err);
//           }
//           const filename =
//             buf.toString("hex") + path.extname(file.originalname);
//           const fileInfo = {
//             filename: filename,
//             bucketName: "uploads",
//           };
//           resolve(fileInfo);
//         });
//       });
//     },
//   });

//   // Initialize multer with the storage settings
  // const upload = multer({ storage });

  // app.post("/api/user/signup", upload.single("image"), signup); // signup should be here
  // app.post(
  //   "/api/blog/addBlog",
  //   refreshToken,
  //   verifyToken,
  //   upload.single("image"),
  //   addBlog
  // );

  
//   app.get("/api/blog/image/:id", async (req, res) => {
//   try {
//     const fileId = req.params.id; // Get the image ID from the URL parameters

//     // Find the file in the GridFS bucket by ID
//     const file = await gfs.files.findOne({ _id: fileId });

//     if (!file) {
//       return res.status(404).json({ error: "File not found" });
//     }

//     // Set the appropriate content type for the response
//     res.set("Content-Type", file.contentType);

//     // Create a read stream from the GridFS bucket and pipe it to the response
//     const readStream = gfs.createReadStream({ _id: fileId });
//     readStream.pipe(res);
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// });

// });



// FILE STORAGE with multer
// Multer: It is a middleware for handling multipart/form-data, which is commonly used for file uploads. It allows you to handle the file upload process easily.
// Define the multer storage and file upload settings. storing files in project folder

// handle storing files
const storage = multer.diskStorage({
  // Destination folder for uploaded files
  destination: function (req,file, cb) {
    cb(null, "public/assets");
  },

  // Filename for uploaded files
  filename: function (req,file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filename = `${uniqueSuffix}-${file.originalname}`;

    cb(null, filename); // Set the filename for the uploaded file
  },
});
// Initialize multer with the storage settings

const upload = multer({ storage });

// requests for retrieving and serving the image file
app.get("/api/blog/image/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, "public/assets", filename);

    res.sendFile(imagePath);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// this routes should be present here because of image upload
app.post("/api/user/signup", upload.single("image"), signup); 
app.post("/api/blog/addBlog",refreshToken,verifyToken,upload.single("image"),addBlog);
app.put("/api/blog/updateBlog/:blogId", refreshToken, verifyToken, upload.single("image"),updateBlog);


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
