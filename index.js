import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/db/db.js";
import userRouter from "./src/routes/userRouter.js";
import googleRouter from "./src/routes/googleRouter.js";
import { apiError } from "./src/utils/apiError.js";
import chatroomRouter from "./src/routes/chatroomRouter.js";

dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Helloooo");
});

// All routes
app.use("/users", userRouter);
app.use("/auth", googleRouter);
app.use("/chatrooms", chatroomRouter);

const startServer = async () => {
  try {
    const dbConnected = await connectDB();

    if (!dbConnected) {
      throw new apiError(500, "Couldn't Connect to DB");
    }

    console.log("Database Connected Successfully!");

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Startup Error:", error);
    process.exit(1); 
  }
};

startServer();
