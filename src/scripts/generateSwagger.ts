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

const distDir = path.resolve(__dirname, "../../dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

const outputPath = path.join(distDir, "swagger.json");
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
console.log("✅ Swagger file written to:", outputPath);
