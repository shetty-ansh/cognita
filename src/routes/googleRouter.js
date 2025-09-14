import express from "express";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/user-model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const googleRouter = express.Router();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Step 1: Redirect to Google
googleRouter.get("/google", (req, res) => {
  const url = client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["openid", "email", "profile"],
  redirect_uri: process.env.GOOGLE_REDIRECT_URI
});
console.log(url)
res.redirect(url);

});


// Step 2: Handle callback
googleRouter.get("/google/callback", async (req, res) => {
  const { code } = req.query;
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  // Find or create user
  let user = await User.findOne({ email: payload.email });
  if (!user) {
    user = await User.create({
      name: payload.name,
      username: payload.email.split("@")[0],
      email: payload.email,
      oauthProvider: "google",
    });
  }

  // Generate JWTs
  const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

  // ✅ send only safe fields
  res.json({
    message: "Google Login Success",
    user: { id: user._id, name: user.name, email: user.email },
    accessToken,
    refreshToken,
  });
});

export default googleRouter;
