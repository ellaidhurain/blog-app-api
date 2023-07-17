import UserData from "../model/UserModel";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const signup = async (req, res) => {
  try {
    const { Name, Email, Password } = req.body;

    //handle already registered email using mongo db obj
    const emailExist = await UserData.findOne({ Email: Email });

    if (emailExist) {
      return res.status(400).json("email already exist");
    }

    //encrypt password
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hashSync(Password, salt);

    //create new User object with Userdata model
    const newUser = new UserData({
      Name: Name,
      Email: Email,
      Password: hash,
      blogs: [],
      picturePath,
      friends,
      location,
      about,
      viewedProfile: Math.floor(Math.random() * 10000),
      impressions: Math.floor(Math.random() * 10000),
    });

    //save data in db
    const saveUser = await newUser.save();

    // Exclude the password field from the response
    saveUser.Password = undefined;

    res.status(201).json(saveUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//login method
const login = async (req, res, next) => {
  const { Email, Password } = req.body;

  try {
    //verify email has registered
    const existingUser = await UserData.findOne({ Email: Email });

    //check email is valid
    if (!existingUser) {
      res.status(404).json({ error: "user not found!" });
    }

    //check password is valid
    const isPasswordMatch = bcrypt.compareSync(Password, existingUser.Password);

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid Email / Password" });
    }

    //if match create token for user
    const token = jwt.sign(
      { id: existingUser._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "2hr",
      }
    ); // it creates base64Url encode token

    //check if already has any token and remove that token from cookies
    if (req.cookies[`${existingUser._id}`]) {
      req.cookies[`${existingUser._id}`] = "";
    }

    existingUser.Password = undefined;

    //add res token to cookies storage.
    res.cookie(String(existingUser._id), token, {
      path: "/",
      expires: new Date(Date.now() + 100000 * 60 * 5), // 30 seconds
      httpOnly: true,
      sameSite: "None",
      withCredentials: true,
      secure: true,
    });

    res
      .status(200)
      .json({ message: "Successfully Logged In", user: existingUser, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//logout is not creating new token. so user is redirected to login
const logout = (req, res) => {
  const cookies = req.headers.cookie;

  //get old token from cookies
  // token=efscaw3524?s&sd

  const prevToken = cookies?.split("=")[1]; // token=efscaw3524?s&sd => ["token", "efscaw3524?s&sd"] => "efscaw3524?s&sd"

  if (!prevToken) {
    return res.status(400).json({ message: "Couldn't find token" });
  }

  jwt.verify(String(prevToken), process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Authentication failed" });
    }
    res.clearCookie(`${user.id}`);
    req.cookies[`${user.id}`] = "";
    return res.status(200).json({ message: "Successfully Logged Out" });
  });
};

// user Authorization
const verifyToken = (req, res, next) => {
  try {
    //get token from cookies storage
    const cookies = req.headers.cookie;

    //if cookies has value string split token from id
    const token = cookies?.split("=")[1];

    if (!token) {
      return res.status(403).json({ message: "Access Denied No token found" });
    }

    //verify token with login secret key
    const verified = jwt.verify(
      String(token),
      process.env.JWT_SECRET_KEY,
      (err, user) => {
        if (err) {
          // catch err from server
          return res.status(400).json({ message: "Invalid Token" });
        }

        //if secret key for that id match the token then store that verified user id in variable
        req.id = user.id;
      }
    );

    next(); // this will trigger next function ones the above process completed
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//refresh token is created when user refresh the page and auto verified with new token
const refreshToken = (req, res, next) => {
  try {
    //get prev token from headers
    const cookies = req.headers.cookie;
    const prevToken = cookies?.split("=")[1];

    if (!prevToken) {
      return res.status(400).json({ message: "Couldn't find token" });
    }

    //verify again with id
    jwt.verify(String(prevToken), process.env.JWT_SECRET_KEY, (err, user) => {
      if (err) {
        // console.log(err);
        return res.status(403).json({ message: "Authentication failed" });
      }

      //if valid token, clear from cookies
      res.clearCookie(`${user.id}`);
      req.cookies[`${user.id}`] = "";

      //req new token
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
        expiresIn: "10d",
      });
      // console.log("Regenerated Token\n", token);

      //send token from cookies
      res.cookie(String(user.id), token, {
        path: "/",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        sameSite: "lax", // allows GET only for cross-site request
        // secure:"true"
      });

      req.id = user.id;
      next();
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { Name, Email, location, about } = req.body;
    const {userId} = req.params;
    console.log(userId);
    const updatedUser = await UserData.findByIdAndUpdate(
      userId,
      {
        Name,
        Email,
        location,
        about,
      },
      { new: true } // Ensure that the updated user data is returned
    );

    if (!updatedUser) {
      res.status(404).json({ error: "user not found" });
    }

    // Exclude the password field from the response
    updatedUser.Password = undefined;

    res.status(201).json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//after verification of userToken with user id get data from db.
const getUser = async (req, res) => {
  //now send that verified req id to user
  const userId = req.id; // logged user id
  try {
    //find data for that id from db
    const user = await UserData.findById(userId, "-password").populate("blogs");
    user.Password = undefined;
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    //return data to user
    return res.status(200).json(user);
  } catch (err) {
    return res.status(200).json({ error: err.message });
  }
};

const getAllUser = async (req, res) => {
  try {
    //find data for that id from db
    const users = await UserData.find();

    const formattedUsers = users.map(
      ({
        _id,
        Name,
        Email,
        picturePath,
        friends,
        location,
        viewedProfile,
        impressions,
        blogs,
        createdAt,
        updatedAt,
      }) => {
        return {
          _id,
          Name,
          Email,
          picturePath,
          friends,
          location,
          viewedProfile,
          impressions,
          blogs,
          createdAt,
          updatedAt,
        };
      }
    );
    //return data to user
    res.status(200).json(formattedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserFriends = async (req, res) => {
  try {
    const { userId } = req.params;

    // const id = req.id;
    const user = await UserData.findById(userId);

    if (!user) {
      res.status(404).json({ error: "user with this id not found" });
    }

    // we use Promise.all for get multiple request
    // const friends = await Promise.all(
    //   user.friends.map((id) => UserData.findById(id))
    // );

    const friends = [];
    for (const id of user.friends) {
      const friend = await UserData.findById(id);
      friends.push(friend);
    }

    const formattedFriends = friends.map(
      ({ _id, Name, location, picturePath }) => {
        return { _id, Name, location, picturePath };
      }
    );

    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addRemoveFriend = async (req, res) => {
  try {
    const userId = req.id;
    const { friendId } = req.params;

    // Validate userId and friendId
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: `Invalid user ID: ${userId}` });
    }

    if (!mongoose.isValidObjectId(friendId)) {
      return res
        .status(400)
        .json({ message: `Invalid friend ID: ${friendId}` });
    }

    const user = await UserData.findById(userId);
    const friend = await UserData.findById(friendId);

    if (!user) {
      return res
        .status(404)
        .json({ message: `No user found with ID: ${userId}` });
    }

    if (!friend) {
      return res
        .status(404)
        .json({ message: `No friend found with ID: ${friendId}` });
    }

    // if already a friend, remove id from friends array
    if (user.friends.includes(friendId)) {
      user.friends = user.friends.filter((id) => id !== friendId);
      friend.friends = friend.friends.filter((id) => id !== userId);
    } else {
      // add to friend list
      user.friends.push(friendId);
      friend.friends.push(userId);
    }

    // Update user and friend objects within a transaction
    const session = await UserData.startSession();
    session.startTransaction();
    //  transaction using a session to ensure atomicity and consistency when updating the user and friend objects
    try {
      await user.save({ session });
      await friend.save({ session });
      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

    // Fetch and format updated friends
    const updatedUser = await UserData.findById(userId);
    //$in: This is a MongoDB operator used to specify an array of values to match. In this case, we're using $in to match documents where the _id value is present in the updatedUser.friends array.
    // So, the query effectively finds all documents in the UserData collection where the _id value is present in the updatedUser.friends array.
    const updatedFriends = await UserData.find({
      _id: { $in: updatedUser.friends },
    });
    const formattedFriends = updatedFriends.map(
      ({ _id, Name, location, picturePath }) => {
        return { _id, Name, location, picturePath };
      }
    );

    //  const updatedFriends = [];
    //  for (const friendId of updatedUser.friends) {
    //   const friend = await UserData.findOne({ _id: friendId });
    //   if (friend) {
    //     updatedFriends.push(friend);
    //   }
    // }

    res.status(200).json(formattedFriends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export {
  signup,
  updateUser,
  login,
  logout,
  verifyToken,
  refreshToken,
  getUser,
  getAllUser,
  getUserFriends,
  addRemoveFriend,
};
