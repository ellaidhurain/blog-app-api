import express from "express";
import mongoose from "mongoose";
import blogRouter from "./routes/blog-routes";
import userRouter from "./routes/user-routes";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv/config";
import morgan from "morgan";

// initialize express
const app = express();

//use cors like this to solve cors error
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  })
);

// middlewares
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000}));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api/user", userRouter);
app.use("/api/blog", blogRouter);

// connect server db

const mongoURI  = process.env.MYDB_CONNECTION
const port = process.env.PORT

mongoose
  .connect(mongoURI)
  .then(() => app.listen(port,"0.0.0.0"))
  .then(() => console.log("Connected To mongo DB and Listening Localhost 5000"))
  .catch((err) => console.log(err));


  // node js is open source server environment is used to run js on server
  // node js has own http methods.
  // express is a web framework is used to create RESTful api. runs top of node js
