import http from "http";
import express, { Request, Response, NextFunction } from "express";
import { Server } from "socket.io";
import { socketHandler } from "./config/socket";
import { connectDB } from "./config/db";
import { setupSwagger } from "./config/swagger";
import cors from "cors";
import allRoutes from "./ruotes/index";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";

const swaggerPath = path.join(__dirname, "swagger.json");
console.log("Looking for Swagger file at:", swaggerPath);
if (!fs.existsSync(swaggerPath)) {
  console.error("Swagger file not found at runtime! Expected at:", swaggerPath);
  throw new Error("Missing swagger.json in deployed environment.");
}
const swaggerDoc = JSON.parse(fs.readFileSync(swaggerPath, "utf8"));

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

setupSwagger(app);

socketHandler(io);
app.set("io", io);

// Use all defined routes
app.use(allRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("GLOBAL ERROR HANDLER:", err.stack || err);

  // If the error has a specific status code, use it, otherwise default to 500
  const statusCode = err.statusCode || 500;
  const message =
    err.message || "An unexpected internal server error occurred.";

  // Ensure a JSON response is sent
  // Check if headers have already been sent to avoid 'ERR_HTTP_HEADERS_SENT'
  if (!res.headersSent) {
    res.status(statusCode).json({
      message: message,
      // Optionally, include the error stack in development for more details
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  } else {
    next(err); // Delegate to default Express error handler if headers already sent
  }
});

const PORT = process.env.PORT || 8000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

module.exports = app;
