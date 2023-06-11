import express from "express";
import { refreshToken,verifyToken} from "../controllers/user-controller";
import {
  addBlog,
  deleteBlog,
  getAllBlogs,
  getById,
  getOneUser,
  updateBlog,
  getAllComments,
  addComment,
  updateComment,
  deleteComment,
  getAllLikes,
  addLike,
  removeLike,
  getallLikesForUser

} from "../controllers/blog-controller";
const blogRouter = express.Router();


blogRouter.post("/addBlog", refreshToken, verifyToken, addBlog);
blogRouter.get("/getAllBlogs", refreshToken, verifyToken, getAllBlogs);
blogRouter.get("/refresh", refreshToken, verifyToken, getAllBlogs);
blogRouter.put("/updateOneBlog/:id", refreshToken, verifyToken, updateBlog);
blogRouter.get("/getOneBlog/:id", refreshToken, verifyToken, getById);
blogRouter.delete("/deleteOneBlog/:id", refreshToken,verifyToken, deleteBlog);
blogRouter.get("/getOneUser/:id", refreshToken,verifyToken, getOneUser);

blogRouter.get("/getAllComments", refreshToken,verifyToken, getAllComments);
blogRouter.post("/addComment", refreshToken,verifyToken, addComment);
blogRouter.put("/updateComment/:commentId", refreshToken,verifyToken, updateComment);
blogRouter.delete("/deleteComment/:commentId", refreshToken,verifyToken, deleteComment);

blogRouter.get("/getAllLikes", refreshToken,verifyToken, getAllLikes);
blogRouter.get("/getallLikesForUser/:userId", refreshToken,verifyToken, getallLikesForUser);
blogRouter.post("/addLike", refreshToken,verifyToken, addLike);
blogRouter.delete("/removeLike/:likeId", refreshToken,verifyToken, removeLike);


export default blogRouter;
