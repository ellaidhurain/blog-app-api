import express from "express";
import {
  login,
  signup,
  updateUser,
  updateProfileImage,
  logout,
  verifyToken,
  refreshToken,
  getUser,
  getAllUser,
  getUserFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  removeFriend,
  updatePassword
} from "../controllers/user-controller";

const userRouter = express.Router();

userRouter.post("/login", login);
userRouter.post("/signup", signup);
userRouter.put("/updateUser", updateUser);
userRouter.put("/updateProfileImage", updateProfileImage);
userRouter.post("/logout", logout);
// userRouter.get("/refresh", refreshToken);
userRouter.get("/getUser", refreshToken, verifyToken, getUser);
userRouter.get("/getAllUser", refreshToken, verifyToken, getAllUser);
userRouter.get(
  "/getUserFriends",
  refreshToken,
  verifyToken,
  getUserFriends,
  
);
userRouter.post(
  "/sendFriendRequest/:friendId",
  refreshToken,
  verifyToken,
  sendFriendRequest
);
userRouter.post(
  "/acceptFriendRequest/:friendId",
  refreshToken,
  verifyToken,
  acceptFriendRequest
);
userRouter.post(
  "/rejectFriendRequest/:friendId",
  refreshToken,
  verifyToken,
  rejectFriendRequest
);
userRouter.get(
  "/getFriendRequests",
  refreshToken,
  verifyToken,
  getFriendRequests
);
userRouter.post(
  "/removeFriend/:friendId",
  refreshToken,
  verifyToken,
  removeFriend
);
userRouter.put(
  "/updatePassword",
  refreshToken,
  verifyToken,
  updatePassword
);

export default userRouter;
