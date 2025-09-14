import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv"
import connectDB from "./src/db/db.js";
import userRouter from "./src/routes/userRouter.js";
import googleRouter from "./src/routes/googleRouter.js";
import { apiError } from "./src/utils/apiError.js";

dotenv.config()
const PORT = process.env.PORT || 3000
const app = express()


const startServer = async () => {
  try {
    await connectDB(); // important
    console.log("Database Connected Successfully!");
    app.listen(PORT, () => {
      console.log(`Server is up and running at http://localhost:${PORT}`);
    });
  } catch (error) {
    throw new apiError(400, "Couldn't Connect to DB");
  }
};

startServer();

app.use(express.json()); 


app.get("/", (req, res) => {
    res.send("Helloooo")
})


//Routes -

app.use("/users", userRouter);
app.use("/auth", googleRouter);

