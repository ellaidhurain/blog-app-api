import express from "express";
import { refreshToken,verifyToken} from "../controllers/user-controller";
import {
  deleteBlog,
  getAllBlogs,
  getOneBlog,
  getOneUserBlogs,
  updateBlog,
  getAllComments,
  addComment,
  updateComment,
  deleteComment,
  getAllLikes,
  addRemoveLike,
  getallLikesForUser,

} from "../controllers/blog-controller";
const blogRouter = express.Router();


blogRouter.get("/getAllBlogs", refreshToken, verifyToken, getAllBlogs);
blogRouter.get("/refreshBlog", refreshToken, verifyToken, getAllBlogs);
blogRouter.put("/updateBlog/:blogId", refreshToken, verifyToken, updateBlog);
blogRouter.get("/getOneBlog/:blogId", refreshToken, verifyToken, getOneBlog);
blogRouter.delete("/deleteOneBlog/:blogId", refreshToken,verifyToken, deleteBlog);
blogRouter.get("/getOneUserBlogs/:userId", refreshToken,verifyToken, getOneUserBlogs);

blogRouter.get("/getAllComments", refreshToken,verifyToken, getAllComments);
blogRouter.post("/addComment/:blogId", refreshToken,verifyToken, addComment);
blogRouter.put("/updateComment/:blogId/:commentId", refreshToken,verifyToken, updateComment);
blogRouter.delete("/deleteComment/:commentId", refreshToken,verifyToken, deleteComment);

blogRouter.get("/getAllLikes", refreshToken,verifyToken, getAllLikes);
blogRouter.get("/getallLikesForUser/:userId", refreshToken,verifyToken, getallLikesForUser);
blogRouter.post("/addRemoveLike/:blogId", refreshToken,verifyToken, addRemoveLike);

export default blogRouter;
