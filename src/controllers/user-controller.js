import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiErrors.js"
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



