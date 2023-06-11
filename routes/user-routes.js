import express from "express";
import { getAllUser, login, signup, logout, verifyToken, refreshToken } from "../controllers/user-controller";

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.post("/logout", logout);
userRouter.get("/getUser", refreshToken,verifyToken, getAllUser);
userRouter.get("/refresh", refreshToken, verifyToken, getAllUser);

export default userRouter;
