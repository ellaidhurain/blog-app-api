import mongoose from "mongoose";
import BlogData from "../model/BlogModel";
import UserData from "../model/UserModel";
import { CommentData, LikeData } from "../model/BlogModel";
import path from "path";

export const addBlog = async (req, res) => {
  try {
    const { title, description } = req.body;

    const userId = req.id;

    //find existing user
    const existingUser = await UserData.findById(userId);

    if (!existingUser) {
      return res.status(404).json({ error: "Unable To FInd User By This ID" });
    }

    let imageUrl = ""; // Variable to store the file path
    if (req.file) {
     
      // File is uploaded
      const basePath = `${req.protocol}://${req.get("host")}`; // Get the base URL

      // Construct the image URL using the base URL and the file path
      imageUrl = `${basePath}/api/blog/image/${req.file.filename}` // this is for public dir
      //  imageUrl = new URL(`/api/blog/image/${req.file.filename}`, basePath).href; // this is for db
    }

    // create new blog obj
    const blog = new BlogData({
      title,
      description,
      image:imageUrl,
      user: userId,
    });

    //session is runtime server storage
    const session = await mongoose.startSession();

    //startTransaction and commitTransaction is used allow and send data to server and user
    session.startTransaction();

    //temporarily save blog data in session. but not yet committed we can aport anytime before commit
    await blog.save({ session });

    //then push data into blogs array
    existingUser.blogs.push(blog);

    //then save that array in db
    await existingUser.save({ session });

    // commit your data
    await session.commitTransaction();

    //  Instead of making an additional request to fetch the added blog separately, returning all blog data in a single response reduces the number of round trips between the client and the server. This can improve the overall performance and efficiency of the application.
    const blogData = await BlogData.find();
    return res.status(201).json({ blog });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const { title, description } = req.body;

    const userId = req.id;

    // if you have the route like /update/:id, then the “id” property is available as req.params.id.
    const blogId = req.params.blogId;
    
    let imageUrl;

    if (req.file) {
      
      // File is uploaded
      const basePath = `${req.protocol}://${req.get("host")}`; // Get the base URL
      
      // Construct the image URL using the base URL and the file path
      imageUrl = `${basePath}/api/blog/image/${req.file.filename}`
    }

    const blog = await BlogData.findByIdAndUpdate(blogId, {
      title,
      description,
      image:imageUrl,
      user:userId,
    });


    if (!blog) {
      return res
        .status(404)
        .json({ error: "Unable To Update The BlogData No blog!" });
    }

    const blogData = await BlogData.find();
    return res.status(200).json(blogData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAllBlogs = async (req, res) => {
  try {
    // The populate("user") part instructs Mongoose to populate the "user" field of each blog document with the
    // corresponding user data from the referenced "UserData" model. This allows you to retrieve the complete user information associated with each blog.

    //The find() method is one of the built-in query methods provided by Mongoose.which is an Object Data Modeling (ODM) library for MongoDB in Node.js
    const blogs = await BlogData.find().populate("user","Name picturePath location") // [{}]

    if (blogs.length === 0) {
      return res.status(404).json({ message: "No Blogs Found" });
    }

    return res.status(200).json(blogs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getOneBlog = async (req, res) => {
  const { blogId } = req.params;

  try {
    const blog = await BlogData.findById(blogId);

    if (!blog) {
      return res.status(404).json({ error: "No BlogData Found" });
    }
    blog.Password = undefined;
    return res.status(200).json({ blog });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteBlog = async (req, res) => {
  const { blogId } = req.params;

  try {
    const blog = await BlogData.findOneAndRemove({ _id: blogId }).populate(
      "user"
    );

    if (!blog) {
      return res.status(404).json({ error: "Unable To Delete! No blog found" });
    }

    await blog.user.blogs.pull(blog);
    await blog.user.save();

    return res.status(200).json({ message: "Successfully Deleted" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getOneUserBlogs = async (req, res) => {
  const { userId } = req.params;

  try {
    // populate is used return in res of all details in the user blogs
    const userBlogs = await UserData.findById(userId);

    if (!userBlogs) {
      return res.status(404).json({ error: "No BlogData Found" });
    }
    userBlogs.Password = undefined;
    return res.status(200).json(userBlogs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAllComments = async (req, res) => {
  try {
    // populate is used to retrive user and blog information related to comments
    const comments = await CommentData.find();
    // find() method returns collection of array value

    // const likesWithSpecificCondition = await LikeData.find({ like: "something" });
    // const likesWithMultipleConditions = await LikeData.find({ like: "something", user: "userId" });

    if (!comments) {
      return res.status(404).json({ message: "No Comments Found" });
    }
    return res.status(200).json(comments);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAllCommentsForBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    const comments = await CommentData.find({ blog: blogId }).populate("user");

    const updatedComments = comments.map((data) => {
      data.user.Password = undefined;
      return {
        ...data._doc,
        user: {
          _id: data.user._id,
          name: data.user.Name,
          picturePath: data.user.picturePath,
        },
      };
    });

    if (!comments) {
      return res.status(404).json({ message: "No Comments Found" });
    }
    return res.status(200).json(updatedComments);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const blog = req.params.blogId;
    const user = req.id;

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

    res.status(201).json({ message: "successfully comment added" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const { blogId, commentId } = req.params;
    const userId = req.id;

    const user = await UserData.findById(userId);
    const blog = await BlogData.findById(blogId);
    const existingComment = await CommentData.findById(commentId);

    if (!blog) {
      return res
        .status(404)
        .json({ message: "No Blog Found with this user ID" });
    }

    if (!user) {
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
    return res.status(500).json({ error: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params  ;

    // Find the comment by ID and delete it
    const deletedComment = await CommentData.findByIdAndDelete(commentId);

    // If the comment doesn't exist, return an error response
    if (!deletedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Comment successfully deleted
    return res.status(200).json({ message: "Comment deleted" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const addRemoveLike = async (req, res) => {
  try {
    const blog = req.params.blogId;
    const user = req.id;

    const userData = await UserData.findById(user);
    const blogData = await BlogData.findById(blog);

    if (!blogData) {
      return res.status(404).json({ error: `No Blog Found with this ID` });
    }

    if (!userData) {
      return res.status(404).json({ error: "No User Found with this user ID" });
    }

    const isLiked = await LikeData.findOne({ user, blog });

    if (isLiked) {
      //if already liked unlike
      await LikeData.findByIdAndDelete(isLiked._id);
      res.status(200).json({ message: "unliked" });
    } else {
      const addLike = new LikeData({ user, blog });
      await addLike.save();

      // Fetch the updated like object from the database
      const updatedLike = await LikeData.findById(addLike._id);
      await blogData.save(); // update in blogData
      res.status(200).json({ like: updatedLike, message: "liked" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getallLikesForBlog = async (req, res) => {
  try {
    const { blogId } = req.params;

    // Find the like for the specified user
    const likes = await LikeData.find({ blog: blogId });

    // If the like doesn't exist, return an error response
    if (!likes) {
      return res.status(404).json({ error: "Like not found for this user" });
    }

    const updatedlikes = likes.map((data) => {
      data.user.Password = undefined;
      return {
        ...data._doc,
        user: {
          _id: data.user._id,
          name: data.user.Name,
          picturePath: data.user.picturePath,
        },
      };
    });

    // Return the like for the user
    return res.status(200).json(updatedlikes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAllLikes = async (req, res) => {
  try {
    const likes = await LikeData.find();

    if (!likes) {
      return res.status(404).json({ error: "No Comments Found" });
    }
    return res.status(200).json({ likes });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
