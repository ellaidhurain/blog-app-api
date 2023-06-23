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
import { refreshToken, signup, verifyToken } from "./controllers/user-controller";
import { addBlog } from "./controllers/blog-controller";
import UserData from "./model/UserModel";

// CONFIGURATIONS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// initialize express
const app = express();

// middle wares
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  })
);

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000}));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({policy:"cross-origin"}));
app.use(bodyParser.json({limit:"30mb",extended:true}));
app.use(bodyParser.urlencoded({limit:"30mb",extended:true}));

app.use("/assets", express.static(path.join(__dirname,"public/assets")))

// FILE STORAGE
// Define the multer storage and file upload settings
const storage = multer.diskStorage({
    // Destination folder for uploaded files
  destination: function(req,res,cb){
    cb(null, "public/assets");
  },
  // Filename for uploaded files
  filename: function(req,res,cb){
    cb(null, Date.now() + "-" + file.originalname);
  }
})

// Initialize multer with the storage settings
export const upload = multer({ storage });

app.post("/api/user/signup", upload.single("picture"), signup);// signup should be here 
app.post("/api/blog/addBlog", refreshToken, verifyToken,upload.single("picture"), addBlog);

app.use("/api/user", userRouter);
app.use("/api/blog", blogRouter);


// connect server db
const mongoURI  = process.env.MYDB_CONNECTION
const port = process.env.PORT || 5001

mongoose
  .connect(mongoURI,{
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => app.listen(port))
  .then(() => {
    console.log(`Connected DB and Listening Localhost ${port}`)
  // UserData.insertMany(users) // users => {} directly including bulk data
})
  .catch((err) => console.log(`${err} did not connect`));


  // node js is open source server environment is used to run js on server
  // node js has own http methods.
  // express is a web framework is used to create RESTful api. runs top of node js
  export default app;