import fs from 'fs';
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {apiResponse} from '../utils/apiResponse.js'

const registerUser = asyncHandler(async (req, res) => {
  //get user detalis from frontened
  //validation - not empty
  //check if user already exists: username, email
  //check for images, check for avatar
  //upload them to clodinary,avatar
  //create user object - create entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return res

  const { fullName, email, username, password } = req.body;
  console.log("email: ", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All field are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new apiError(409, "User with email or username Already Exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (req.files?.coverImage?.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  // if(req.files && Array.isArray(req.files.coverImage) && req.file.coverImage.length > 0){
  //   coverImageLocalPath = req.files?.coverImage[0].path
  // }

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  
  let coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  if (!avatar) {
    throw new apiError(400, "Avatar file required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new apiError(500, "Something went wrong while registering");
  }

  return res.status(201).json(
    new apiResponse(200,createdUser, "User Registered Successfully" )
  )
});

export { registerUser };
