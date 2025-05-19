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

    servers: [
      { url: "http://localhost:8000", description: "Local server" },
      {
        url: "https://teamhub-six.vercel.app",
        description: "Vercel production",
      },
      {
        url: "https://teamhub-87t6.onrender.com",
        description: "Render production",
      },
    ],
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
