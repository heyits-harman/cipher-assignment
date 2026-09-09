import express from "express";
import problemRoutes from "./route/problemRoutes";
import attemptRoutes from "./route/attemptRoutes";
import evaluationRoutes from "./route/evaluationRoutes";
const app = express();

app.use(express.json());

// Enable CORS for frontend integration
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use("/problems", problemRoutes);
app.use("/attempts", attemptRoutes);
app.use("/evaluations", evaluationRoutes);

export default app;