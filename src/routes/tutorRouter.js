import { Router } from "express";
import { getGeminiResponseText, tutorMain } from "../controllers/tutor-controller.js";
import verifyJWT from "../middlewares/auth.js";

const tutorRouter = Router();

tutorRouter.post("/voice", verifyJWT, async (req, res) => {
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

tutorRouter.post("/chat", verifyJWT, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing 'prompt' in request body" });
    }

    const result = await getGeminiResponseText(prompt);
    res.status(200).json({ message: "Response generated successfully", ...result });

  } catch (error) {
    console.error("Error in /tutor route:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "Internal server error" });
  }
});

export default tutorRouter;
