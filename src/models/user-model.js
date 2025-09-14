import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: {
  type: String,
  required: function () {
    return !this.oauthProvider; // password only required if not OAuth
  }
},
  oauthProvider: String,
  avatar: String,
  bio: String,
  interests: [String],
  role: { type: String, default: "student" },
  stats: {
    studyHours: { type: Number, default: 0 },
    streak: { type: Number, default: 0 }
  },
  badges: [String],
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

userSchema.methods.newAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, username: this.username, name: this.name },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
  );
};

userSchema.methods.newRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  );
};

export const User = mongoose.model("User", userSchema);
