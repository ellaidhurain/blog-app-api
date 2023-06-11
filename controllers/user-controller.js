import UserData from "../model/UserModel";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const signup = async (req, res) => {
  try {
    //handle already registered email using mongo db obj
    const emailExist = await UserData.findOne({ Email: req.body.Email });

    if (emailExist) {
      return res.status(400).json("email already exist");
    }

    //encrypt password
    const hash = await bcrypt.hashSync(req.body.Password, 10);

    //send payload
    const postUsers = new UserData({
      Name: req.body.Name,
      Email: req.body.Email,
      Password: hash,
      blogs: [],
    });

    //save data in db
    const saveUsers = await postUsers.save();
    res.status(200).json(saveUsers);
  } catch (err) {
    res.status(400).json({ err: err });
    // console.log(res);
  }
};

// checking
class AppError extends Error {
  constructor(message, statusCode) {
    // this is the official error message rom the error it self, this message will be in the response.json for the client
    super(message);

    this.statusCode = statusCode;
    this.statusMessage = message;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}


//login method
const login = async (req, res, next) => {
  const { Email, Password } = req.body;

  let existingUser;
  try {
    //verify email has registered
    existingUser = await UserData.findOne({ Email: Email });
   
  } catch (err) {
    throw new Error(err)
  }

  //check email is valid
  if (!existingUser) {
    let error = next(new AppError(`processing error in request at`, 400))
    return error
  }

  //check password is valid
  const isPasswordCorrect = bcrypt.compareSync(Password, existingUser.Password);
  if (!isPasswordCorrect) {
    return res.status(400).json({ message: "Invalid Email / Password" });
  }

  //if valid create token for user
  const token = jwt.sign({ id: existingUser._id }, "secret_key", {
    expiresIn: "10h",
  });

  // console.log("Generated Token\n", token);

  //check if already has any token and remove that token from cookies
  if (req.cookies[`${existingUser._id}`]) {
    req.cookies[`${existingUser._id}`] = "";
  }

  //send token from cookies.
  res.cookie(String(existingUser._id), token, {
    path: "/",
    expires: new Date(Date.now() + 10000 * 300), // 30 seconds
    httpOnly: true,
    sameSite: "lax",
    // secure:"true" // set secure true is most secure. user also not getting token from server
  });

  return res
    .status(200)
    .json({ message: "Successfully Logged In", user: existingUser, token });
};

//after verification of userToken with user id get data from db.
const getAllUser = async (req, res, next) => {
  //now send that verified req id to user
  const userId = req.id;
  let user;
  try {
    //find data for that id from db
    user = await UserData.findById(userId, "-password");
  } catch (err) {
    return new Error(err);
  }
  if (!user) {
    return res.status(404).json({ message: "User Not Found" });
  }

  //return data to user
  return res.status(200).json({ user });
};

//logout is not creating new token. so user is redirected to login
const logout = (req, res, next) => {
  const cookies = req.headers.cookie;

  //get old token from cookies
  // token=efscaw3524?s&sd

  const prevToken = cookies?.split("=")[1]; // => ["token", "efscaw3524?s&sd"] => "efscaw3524?s&sd"
  
  if (!prevToken) {
    return res.status(400).json({ message: "Couldn't find token" });
  }

  jwt.verify(String(prevToken), "secret_key", (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Authentication failed" });
    }
    res.clearCookie(`${user.id}`);
    req.cookies[`${user.id}`] = "";
    return res.status(200).json({ message: "Successfully Logged Out" });
  });
};

// After login new token will be created for that id/secret key.
// user Authorization

 const verifyToken = (req, res, next) => {
    //get token from cookies
    const cookies = req.headers.cookie;
  
    //if cookies has value string split token from id
    const token = cookies?.split("=")[1];
    if (!token) {
      return res.status(404).json({ message: "No token found" });
    }
  
    //verify token with login secret key
    jwt.verify(String(token),"secret_key", (err, user) => {
      if (err) {
        return res.status(400).json({ message: "Invalid Token" });
      }
      // console.log(user.id);
  
      //if secret key for that id match the token then store that verified user id in variable
      req.id = user.id;
    });
    next(); // this will trigger next function ones this completed 
    // console.log(next);
  };



//refresh token is created when user refresh the page and auto verified with new token
const refreshToken = (req, res, next) => {
    //get prev token from headers
    const cookies = req.headers.cookie;
    const prevToken = cookies?.split("=")[1];

    if (!prevToken) {
      return res.status(400).json({ message: "Couldn't find token" });
    }

    //verify again with id
    jwt.verify(String(prevToken),"secret_key", (err, user) => {
      if (err) {
        // console.log(err);
        return res.status(403).json({ message: "Authentication failed" });
      }

      //if valid token, clear from cookies
      res.clearCookie(`${user.id}`);
      req.cookies[`${user.id}`] = "";
  
      //req new token
      const token = jwt.sign({ id: user.id },"secret_key", {
        expiresIn: "10d",
      });
      // console.log("Regenerated Token\n", token);
  
      //send token from cookies
      res.cookie(String(user.id), token, {
        path: "/",
        expires: new Date(Date.now() + 10000 * 300), // 30 seconds
        httpOnly: true,
        // sameSite: "strict", //not allows cross-site request. very safe
        sameSite: "lax", // allows GET only for cross-site request
        // secure:"true"
      });
  
      req.id = user.id;
      next();
    });
  };


export { signup, login, getAllUser, logout ,verifyToken, refreshToken};


