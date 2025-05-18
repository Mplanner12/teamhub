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
    servers: [{ url: "https://teamhub-six.vercel.app" }],
  },
  apis: ["./src/modules/**/*.ts"],
});

fs.writeFileSync(
  path.join(__dirname, "../swagger.json"),
  JSON.stringify(swaggerSpec, null, 2)
);
