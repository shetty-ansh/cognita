import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js"
import { User } from "../models/user-model.js";

const registerUser = asyncHandler(async (req, res) => {

    const { name, username, email, password } = req.body;

    if (
        [name, username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new apiError(400, "Form Field Empty");
    }

    const userExists = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (userExists) {
        console.log("Account already exists")
        throw new apiError(409, "Account already exists.")
    }

    const newUser = await User.create({
        name,
        username: username.toLowerCase(),
        email,
        password
    })


    const userCreated = await User.findById(newUser._id).select("-password -refreshToken");

    if (!userCreated) {
        throw new apiError(500, "Problem while registering new user");
    }

    return res.status(201).json({ message: "User Added Successfully", user: userCreated });

});

const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId)

    const accessToken = user.newAccessToken()
    const refreshToken = user.newRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
  } catch (error) {
    throw new apiError(500, "Something went wrong while generating tokens")
  }
}


const loginUser = asyncHandler(async (req, res) => {

    const { username, password } = req.body

    if (!username) {
        throw new apiError(404, "Username required to login!")
    }

    const currentUser = await User.findOne({username})

    if (!currentUser) {
        throw new apiError(404, "Username not found!")
    }

    const correctPassword = await currentUser.isPasswordCorrect(password)

    if (!correctPassword) {
        throw new apiError(401, "Incorrect Password. Try again!")
    }

    const { accessToken, refreshToken } = await generateTokens(currentUser._id)

    const loggedInUser = await User.findById(currentUser._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json({
        user: loggedInUser, accessToken,
        refreshToken: refreshToken

    }, "User logged in successfully")

})

export {registerUser, loginUser}


