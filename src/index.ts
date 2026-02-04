import AgentAPI from "apminsight";
AgentAPI.config()

import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import subjectsRouter from "./routes/subjects.js";
import { auth } from "./lib/auth.js";
import securityMiddleware from "./middleware/security";

const app = express();
const PORT = 8000;

app.use(
    cors({
        origin: process.env.FRONTEND_URL, // React app URL
        methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
        credentials: true, // allow cookies
    })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use(securityMiddleware);

app.use("/api/subjects", subjectsRouter);

app.get("/", (req, res) => {
    res.send("Backend server is running!");
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});