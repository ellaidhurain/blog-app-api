import UserData from "../model/UserModel";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
// import argon2 from 'argon2';

const signup = async (req, res) => {
  try {
    const { Name, Email, Password } = req.body;

    // check if email is already registered
    const emailExist = await UserData.findOne({ Email: Email });

    if (emailExist) {
      return res.status(400).json({error:"email already exist"});
    }

    //encrypt password using bcrypt. we cant decrypt hashed password
    const salt = await bcrypt.genSalt(); //This line generates a cryptographic salt. A salt is a random value that is added to the password before hashing to increase the complexity of the resulting hash.
    const hashedPassword = bcrypt.hashSync(Password, salt);

    // Encrypt password using Argon2
    // const hash = await argon2.hash(Password);

    //create new User object in UserData collection
    const newUser = new UserData({
      Name: Name,
      Email: Email,
      Password: hashedPassword,
      blogs: [],
      viewedProfile: Math.floor(Math.random() * 10000),
      impressions: Math.floor(Math.random() * 10000),
    });

    //save data in db
    const savedUser = await newUser.save();

    // Exclude the password field from the response
    savedUser.Password = undefined;

    return res
      .status(201)
      .json({ message: "user created successfully" ,user: savedUser});
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Authentication
// const login = async (req, res, next) => {
//   const { Email, Password } = req.body;

//   try {
//     //verify email has registered
//     const existingUser = await UserData.findOne({ Email: Email });

//     //check email is valid
//     if (!existingUser) {
//       return res.status(404).json({ error: "user not found!" });
//     }

//     //check password is valid, Compare the entered password with the stored hash
//     const isPasswordMatch = bcrypt.compareSync(Password, existingUser.Password);

//     if (!isPasswordMatch) {
//       return res.status(400).json({ message: "Invalid Email / Password" });
//     }

//     //if password match create token for user
//     const token = jwt.sign(
//       { id: existingUser._id },
//       process.env.JWT_SECRET_KEY,
//       {
//         expiresIn: "2hr",
//       }
//     ); // it creates base64Url encoded token

//     //check if already has any token and remove that token from cookies
//     if (req.cookies[`${existingUser._id}`]) {
//       req.cookies[`${existingUser._id}`] = "";
//     }

//     existingUser.Password = undefined;

//     //send res token to cookie storage.
//       res.cookie(String(existingUser._id), token, {
//         path: "/",
//         expires: new Date(Date.now() + 100000 * 60 * 5), // 30 seconds
//         httpOnly: true,
//         sameSite: "none",
//         withCredentials: true,
//         secure: true,
//       });

//     return res
//       .status(200)
//       .json({ message: "Successfully Logged In", user: existingUser, token });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

//logout is not creating new token. so user is redirected to login
const logout = (req, res) => {
  try {
    const cookies = req.headers.cookie;

    //get old token from cookies
    // token=efscaw3524?s&sd

    const prevToken = cookies?.split("=")[1]; // token=efscaw3524?s&sd => ["token", "efscaw3524?s&sd"] => "efscaw3524?s&sd"

    if (!prevToken) {
      return res.status(400).json({ error: "Couldn't find token" });
    }

    jwt.verify(String(prevToken), process.env.JWT_SECRET_KEY, (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Authentication failed" });
      }
      res.clearCookie(`${user.id}`);
      req.cookies[`${user.id}`] = "";
      return res.status(200).json({ message: "Successfully Logged Out" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// credentials and token is stored in http headers , user data is stored in http body
// user Authorization
// const verifyToken = (req, res, next) => {
//   try {
//     //get token from cookies storage
//     const cookies = req.headers.cookie;

//     //if cookies has value string split token from id
//     const token = cookies?.split("=")[1]; // => ["id", "token"]

//     if (!token) {
//       return res.status(403).json({ message: "Access Denied No token found" });
//     }

//     //verify token with login secret key
//     const verified = jwt.verify(
//       String(token),
//       process.env.JWT_SECRET_KEY,
//       (err, user) => {
//         if (err) {
//           // catch err from server
//           return res.status(400).json({ message: "Invalid Token" });
//         }

//         //if secret key for that id match the token then store that verified user id in variable
//         req.id = user.id;
//       }
//     );

//     next(); // this will trigger next function ones the above process completed
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

// //refresh token is created when user refresh the page and auto verified with new token
// const refreshToken = (req, res, next) => {
//   try {
//     //get prev token from headers
//     const cookies = req.headers.cookie;
//     const prevToken = cookies?.split("=")[1];

//     if (!prevToken) {
//       return res.status(400).json({ message: "Couldn't find token" });
//     }

//     //verify again with id
//     jwt.verify(String(prevToken), process.env.JWT_SECRET_KEY, (err, user) => {
//       if (err) {
//         // console.log(err);
//         return res.status(403).json({ message: "Authentication failed" });
//       }

//       //if valid token, clear from cookies
//       res.clearCookie(`${user.id}`);
//       req.cookies[`${user.id}`] = "";

//       //req new token
//       const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
//         expiresIn: "10d",
//       });
//       // console.log("Regenerated Token\n", token);

//       //send token from cookies
//       res.cookie(String(user.id), token, {
//         path: "/",
//         expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
//         httpOnly: true,
//         sameSite: "lax", // allows GET only for cross-site request
//         // secure:"true"
//       });

//       req.id = user.id;
//       next();
//     });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

const updateUser = async (req, res) => {
  try {
    const { Name, Email, location, about } = req.body;
    const  userId = req.userId;
    const updatedUser = await UserData.findByIdAndUpdate(
      userId,
      {
        Name,
        Email,
        location,
        about,
      },
      { new: true } // Ensure that the updated user data is returned
    ).select("-Password"); // remove password from response

    if (!updatedUser) {
      return res.status(404).json({ error: "user not found" });
    }

    return res.status(201).json(updatedUser);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const updateProfileImage = async (req, res) => {
  try {
    const userId = req.userId;
    let imageUrl;
    if (req.file) {
      // File is uploaded
      const basePath = `${req.protocol}://${req.get("host")}`; // Get the base URL => http://localhost:5000

      // Construct the image URL using the base URL and the file path
      imageUrl = `${basePath}/api/blog/image/${req.file.filename}`;
    }

    const updatedUser = await UserData.findByIdAndUpdate(
      userId,
      {
        picturePath: imageUrl,
      },
      { new: true } // Ensure that the updated user data is returned
    ).select("-Password");

    if (!updatedUser) {
      res.status(404).json({ error: "user not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const userId = req.id;
    const { Password } = req.body;

    const user = await UserData.findById(userId).exec();

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const [oldPassword, newPassword] = Password.split("|");

    const isOldPasswordMatch = bcrypt.compareSync(oldPassword, user.Password);

    if (!isOldPasswordMatch) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        error: "New password must be different from the old password",
      });
    }

    // Hash the new password before saving it
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

    user.Password = hashedNewPassword;

    await user.save();

    return res.status(200).json({ message: "password changed successfully" });
  } catch (error) {
    return res.status(500).json({error:error.message});
  }
};

//after verification of userToken with user id get data from db.
const getUser = async (req, res) => {
  //now send that verified req id to user
  const userId = req.userId; // logged user id
  try {
    //find data for that id from db
    const user = await UserData.findById(userId, "-password").populate("blogs");
    // user.Password = undefined;
    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    //return data to user
    return res.status(200).json(user);
  } catch (error) {
    return res.status(200).json({ error: error.message });
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
    return res.status(200).json(formattedUsers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getUserFriends = async (req, res) => {
  try {
    const userId = req.userId;

    // const id = req.id;
    const user = await UserData.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "user with this id not found" });
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

    // show particular details only in response
    const formattedFriends = friends.map(
      ({ _id, Name, location, picturePath }) => {
        return { _id, Name, location, picturePath };
      }
    );

    return res.status(200).json(formattedFriends);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getFriendRequests = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await UserData.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "user with this id not found" });
    }

    const friendRequests = [];
    for (const id of user.friendRequests) {
      const request = await UserData.findById(id);
      friendRequests.push(request);
    }

    if (!user.friendRequests) {
      user.friendRequests = [];
    }

    // show particular details only in response
    const formattedFriends = friendRequests.map(
      ({ _id, Name, location, picturePath }) => {
        return { _id, Name, location, picturePath };
      }
    );

    return res.status(200).json(formattedFriends);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { friendId } = req.params;

    const user = await UserData.findById(userId);
    const friend = await UserData.findById(friendId);

    if (!user) {
      return res
        .status(404)
        .json({ error: `No user found with ID: ${userId}` });
    }

    if (!friend) {
      return res
        .status(404)
        .json({ error: `No friend found with ID: ${friendId}` });
    }

    // Check if the friend request has already been sent
    if (friend.friendRequests.includes(userId)) {
      return res.status(400).json({ error: `Friend request already sent` });
    }

    // Add the friendId to the FriendRequests array of the user
    friend.friendRequests.push(userId);

    // Save the user object with the updated sentFriendRequests
    await friend.save();

    return res.status(200).json({ message: `Friend request sent` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const  userId = req.userId;
    const { friendId } = req.params;

    const user = await UserData.findById(userId);
    const friend = await UserData.findById(friendId);

    if (!user) {
      return res
        .status(404)
        .json({ error: `No user found with ID: ${userId}` });
    }

    if (!friend) {
      return res
        .status(404)
        .json({ error: `No friend found with ID: ${friendId}` });
    }

    // Check if the friendId is present in the sentFriendRequests array of the user
    if (!user.friendRequests.includes(friendId)) {
      return res
        .status(400)
        .json({ error: `No friend request found from ${friendId}` });
    }

    // Remove the friendId from the sentFriendRequests array of the user
    user.friendRequests = user.friendRequests.filter((id) => id !== friendId);

    // Add the friendId to the friends array of the user and the userId to the friends array of the friend
    user.friends.push(friendId);
    friend.friends.push(userId);

    // Update user and friend objects within a transaction
    const session = await UserData.startSession();
    session.startTransaction();
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

    return res.status(200).json({ message: `Friend request accepted` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const rejectFriendRequest = async (req, res) => {
  try {
    const  userId = req.userId;
    const { friendId } = req.params;

    const user = await UserData.findById(userId);
    const friend = await UserData.findById(friendId);

    if (!user) {
      return res
        .status(404)
        .json({ error: `No user found with ID: ${userId}` });
    }

    if (!friend) {
      return res
        .status(404)
        .json({ error: `No friend found with ID: ${friendId}` });
    }

    // Check if the friendId is present in the sentFriendRequests array of the user
    if (!user.friendRequests.includes(friendId)) {
      return res
        .status(400)
        .json({ error: `No friend request found from ${friendId}` });
    }

    // Remove the friendId from the sentFriendRequests array of the user
    user.friendRequests = user.friendRequests.filter((id) => id !== friendId);

    // Save the user object with the updated sentFriendRequests
    await user.save();

    return res
      .status(200)
      .json({ message: `Friend request from ${friendId} rejected` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const removeFriend = async (req, res) => {
  try {
    const  userId = req.userId;
    const { friendId } = req.params;

    const user = await UserData.findById(userId);
    const friend = await UserData.findById(friendId);

    if (!user) {
      return res
        .status(404)
        .json({ error: `No user found with ID: ${userId}` });
    }

    if (!friend) {
      return res
        .status(404)
        .json({ error: `No friend found with ID: ${friendId}` });
    }

    // Check if the friendId is present in the sentFriendRequests array of the user
    if (!user.friends.includes(friendId)) {
      return res
        .status(400)
        .json({ error: `No friend request found from ${friendId}` });
    }

    // Remove the friendId from the sentFriendRequests array of the user
    user.friends = user.friends.filter((id) => id !== friendId);

    // Save the user object with the updated sentFriendRequests
    await user.save();

    return res.status(200).json({ message: `Friend removed` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "50min", // Access token expires in 15 minutes
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d", // Refresh token expires in 7 days
  });
};

// Authentication - it check user is valid
const login = async (req, res) => {
  const { Email, Password } = req.body;

  try {
    // Verify email has registered
    const existingUser = await UserData.findOne({ Email: Email });

    // Check email is valid
    if (!existingUser) {
      return res.status(404).json({ error: "User not found!" });
    }

    // Check password is valid, Compare the entered password with the stored hash
    const isPasswordMatch = bcrypt.compareSync(Password, existingUser.Password);

    if (!isPasswordMatch) {
      return res.status(400).json({ error: "Invalid Email / Password" });
    }

    // Generate access token and refresh token
    const accessToken = generateAccessToken(existingUser._id);

    existingUser.Password = undefined;

    // Send both tokens in the response headers
    res.setHeader("Authorization", `Bearer ${accessToken}`);

    const authObject = { message: "Successfully Logged In", user: existingUser,  accessToken}
    return res
      .status(200)
      .json(authObject);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/*
Refresh Token:
The refresh token, is used to obtain a new verify token once the current one expires. It has a longer expiration time than the verify token. When the verify token expires, the user can send the refresh token to the server to obtain a new verify token without having to log in again. The server checks the refresh token's validity, and if it's valid, it issues a new verify token to the user. This process helps maintain a seamless user experience without the need for frequent logins.
*/

const refreshToken = (req, res, next) => {
  try {
    // Get the access token from headers
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];

    if (!accessToken) {
      return res.status(400).json({ error: "Couldn't find refresh token" });
    }

    // Verify the refresh token
    jwt.verify(accessToken, process.env.JWT_SECRET_KEY, (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Authentication failed" });
      }

      const newVerifyToken = generateRefreshToken(user.id);

      // Send both tokens in the response headers
      res.setHeader("Authorization", `Bearer ${newVerifyToken}`);
      next();
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Authorization - it checks user has the permission to access resource
// Verify Token:
// The verify token (access token) is used to authenticate the user for a short period. It typically has a relatively short expiration time, such as a few minutes, to provide higher security. When a user makes a request to the server, the verify token is sent along with the request (usually in the "Authorization" header) to prove that the user is authenticated and has permission to access the requested resource. The server verifies the token's integrity and expiration before processing the request. If the token is valid, the user is granted access to the requested resource; otherwise, the server denies access.

const verifyToken = (req, res, next) => {
  try {
    // Get token from headers
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(403).json({ error: "Access Denied: No token found" });
    }

    // Verify token with the secret key
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          // Handle token expiration error here
          return res.status(401).json({ error: "Token has expired" });
        }
        return res.status(400).json({ error: "Invalid Token" });
      }

      // Store the verified user ID in the request object
      req.userId = user.id;
      next();
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
  updateProfileImage,
  updatePassword,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  removeFriend,
};


