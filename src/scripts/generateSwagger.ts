import fs from "fs";
import path from "path";
import swaggerJSDoc from "swagger-jsdoc";

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TeamHub API",
      version: "1.0.0",
      description: "TeamHub backend API docs powered by Plannorium",
    },
    servers: [{ url: "https://localhost:8000" }],
  },
  apis: ["./src/modules/**/*.ts"],
});

const outputPath = path.resolve(__dirname, "../../dist/swagger.json");
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
