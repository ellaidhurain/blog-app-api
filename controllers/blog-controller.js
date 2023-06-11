import mongoose from "mongoose";
import BlogData from "../model/BlogModel";
import UserData from "../model/UserModel";
import { CommentData, LikeData } from "../model/BlogModel";

export const getAllBlogs = async (req, res, next) => {
  let blogs;
  try {
    // The populate("user") part instructs Mongoose to populate the "user" field of each blog document with the
    // corresponding user data from the referenced "UserData" model. This allows you to retrieve the complete user information associated with each blog.

    //The find() method is one of the built-in query methods provided by Mongoose.which is an Object Data Modeling (ODM) library for MongoDB in Node.js
    blogs = await BlogData.find().populate("user");
    const id = req.id;
    const userId = await BlogData.findById(id);
    console.log(userId);
  } catch (err) {
    // console.log(err);
    throw new Error(err);
  }
  if (!blogs) {
    return res.status(404).json({ message: "No Blogs Found" });
  }
  return res.status(200).json({ blogs });
};

export const addBlog = async (req, res, next) => {
  const { title, description, image, user } = req.body;

  let existingUser;
  try {
    //find existing user
    existingUser = await UserData.findById(user);
  } catch (err) {
    throw new Error(err);
  }

  if (!existingUser) {
    return res.status(400).json({ message: "Unable To FInd User By This ID" });
  }

  // construct a blog obj
  const blog = new BlogData({
    title,
    description,
    image,
    user,
  });

  try {
    //session is runtime server storage
    const session = await mongoose.startSession();

    //startTransaction and commitTransaction is used allow and send data to server and user
    session.startTransaction();

    //save blog data in session
    await blog.save({ session });

    //then push data into blogs array
    existingUser.blogs.push(blog);

    //then save that array in db
    await existingUser.save({ session });

    // commit your data
    await session.commitTransaction();
  } catch (err) {
    // console.log(err);
    throw new Error(err);
  }

  return res.status(200).json({ blog });
};

export const updateBlog = async (req, res, next) => {
  try {
    const { title, description, image, user } = req.body;

    // if you have the route like /update/:id, then the “id” property is available as req.params.id.
    const blogId = req.params.id;

    const blog = await BlogData.findByIdAndUpdate(blogId, {
      title,
      description,
      image,
      user,
    });

    if (!blog) {
      return res
        .status(500)
        .json({ message: "Unable To Update The BlogData No blog!" });
    }
    //return the res is show the data in console
    return res.status(200).json({ blog });
  } catch (err) {
    throw new Error(err);
  }
};

export const getById = async (req, res, next) => {
  const id = req.params.id;

  try {
    const blog = await BlogData.findById(id);

    if (!blog) {
      return res.status(404).json({ message: "No BlogData Found" });
    }

    return res.status(200).json({ blog });
  } catch (err) {
    return console.log(err);
  }
};

export const deleteBlog = async (req, res, next) => {
  const id = req.params.id;

  try {
    const blog = await BlogData.findByIdAndRemove(id).populate("user");
    //blog = {user:id, {blogs:[id1,id2]}}

    //remove() blog id removes entire blog
    //pull particular blog
    await blog.user.blogs.pull(blog);

    //now save the changes
    await blog.user.save();

    if (!blog) {
      return res.status(500).json({ message: "Unable To Delete! no blog" });
    }
    return res.status(200).json({ message: "Successfully Delete" });
  } catch (err) {
    console.log(err);
  }
};

export const getOneUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const userBlogs = await UserData.findById(userId).populate("blogs");

    if (!userBlogs) {
      return res.status(404).json({ message: "No BlogData Found" });
    }
    return res.status(200).json({ user: userBlogs });
  } catch (err) {
    return console.log(err);
  }
};

export const getAllComments = async (req, res) => {
  try {
    // populate is used to retrive user and blog information related to comments
    const comments = await CommentData.find().populate("user").populate("blog");
    // find() method returns collection of array value

    // const likesWithSpecificCondition = await LikeData.find({ like: "something" });
    // const likesWithMultipleConditions = await LikeData.find({ like: "something", user: "userId" });

    if (!comments) {
      return res.status(404).json({ message: "No Comments Found" });
    }
    return res.status(200).json({ comments });
    // {
    //  "allComments": [{"comment": "new comment",}]
    // }
  } catch (err) {
    throw new Error(err);
  }
};

export const addComment = async (req, res) => {
  try {
    const { comment, user, blog } = req.body;

    const userId = await UserData.findById(user);
    const blogId = await BlogData.findById(blog);

    if (!blogId) {
      return res
        .status(404)
        .json({ message: "No Blog Found with this user ID" });
    }

    if (!userId) {
      return res
        .status(404)
        .json({ message: "No User Found with this user ID" });
    }

    // Create a new CommentData instance
    const newComment = new CommentData({
      comment: comment,
      user: user, // Assuming you have authenticated users and have the current user's ID available in req.user._id
      blog: blog,
    });

    //save the blog and the comment
    await newComment.save();

    /*
    When you modify an array field of a document (in this case, the comments array of the blog document), Mongoose doesn't automatically detect the changes and save them to the database. You need to explicitly call the save() method on the document to persist the changes.

    By calling await blog.save() after adding the comment to the blog.comments array, you ensure that the updated blog document, including the new comment, is saved to the database.
    */
    await blogId.save();

    res.status(200).json({ message: "successfully comment added" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
    throw new Error(err);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { comment, user, blog } = req.body;

    const userId = await UserData.findById(user);
    const blogId = await BlogData.findById(blog);
    const existingComment = await CommentData.findById(commentId);

    if (!blogId) {
      return res
        .status(404)
        .json({ message: "No Blog Found with this user ID" });
    }

    if (!userId) {
      return res
        .status(404)
        .json({ message: "No User Found with this user ID" });
    }

    if (!existingComment) {
      return res
        .status(404)
        .json({ message: "No Comment Found with this comment ID" });
    }

    const updatedComment = await CommentData.findByIdAndUpdate(
      commentId,
      {
        comment,
      },
      { new: true }
    );

    return res.status(200).json({ updatedComment });
  } catch (err) {
    return next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    // Find the comment by ID and delete it
    const deletedComment = await CommentData.findByIdAndDelete(commentId);

    // If the comment doesn't exist, return an error response
    if (!deletedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Comment successfully deleted
    return res.status(200).json({ message: "Comment deleted" });
  } catch (err) {
    return next(err);
  }
};

export const getAllLikes = async (req, res) => {
  try {
    const likes = await LikeData.find().populate("user").populate("blog");

    if (!likes) {
      return res.status(404).json({ message: "No Comments Found" });
    }
    return res.status(200).json({ likes });
  } catch (err) {
    throw new Error(err);
  }
};

export const getallLikesForUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Find the like for the specified user
    const like = await LikeData.find({ user: userId });

    // If the like doesn't exist, return an error response
    if (!like) {
      return res.status(404).json({ message: "Like not found for this user" });
    }

    // Return the like for the user
    return res.status(200).json({ like });
  } catch (err) {
    return next(err);
  }
};

export const addLike = async (req, res) => {
  try {
    const { user, blog } = req.body;

    const userId = await UserData.findById(user);
    const blogId = await BlogData.findById(blog);

    if (!blogId) {
      return res
        .status(404)
        .json({ message: "No Blog Found with this user ID" });
    }

    if (!userId) {
      return res
        .status(404)
        .json({ message: "No User Found with this user ID" });
    }

    const likeExist = await LikeData.findOne({ user, blog });

    if (likeExist) {
      return res.status(400).json({ message: "already liked" });
    }

    // Create a new CommentData instance
    const newLike = new LikeData({
      user: user, // Assuming you have authenticated users and have the current user's ID available in req.user._id
      blog: blog,
    });

    //save the blog and the comment
    await newLike.save();
    await blogId.save();

    res.status(200).json({ message: "successfully like added" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
    throw new Error(err);
  }
};

export const removeLike = async (req, res, next) => {
  try {
    const { likeId } = req.params;

    // Find the like by ID and delete it
    const deletedLike = await LikeData.findByIdAndDelete(likeId);

    // If the like doesn't exist, return an error response
    if (!deletedLike) {
      return res.status(404).json({ message: "Like not found" });
    }

    // Like successfully deleted
    return res.status(200).json({ message: "Like removed" });
  } catch (err) {
    return next(err);
  }
};
