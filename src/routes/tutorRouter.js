import { Router } from "express";
import { tutorMain } from "../controllers/tutor-controller.js";

const tutorRouter = Router();

tutorRouter.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing 'prompt' in request body" });
    }

    const result = await tutorMain(prompt);
    res.status(200).json({ message: "Audio generated successfully", ...result });

  } catch (error) {
    console.error("Error in /tutor route:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "Internal server error" });
  }
});

export default tutorRouter;
