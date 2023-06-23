import express from "express";
import { login, logout, verifyToken, refreshToken, getUser,getAllUser ,getUserFriends,addRemoveFriend } from "../controllers/user-controller";


const userRouter = express.Router();

userRouter.post("/login", login);
userRouter.post("/logout", logout);
userRouter.get("/refresh", refreshToken, verifyToken, getUser);

userRouter.get("/getUser", refreshToken,verifyToken, getUser);
userRouter.get("/getAllUser", refreshToken,verifyToken, getAllUser);
userRouter.get("/getUserFriends/:userId", refreshToken,verifyToken, getUserFriends);
userRouter.post("/addRemoveFriend/:friendId", refreshToken,verifyToken,addRemoveFriend);


export default userRouter;
