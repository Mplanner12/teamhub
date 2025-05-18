import swaggerJSDoc from "swagger-jsdoc";
import basicAuth from "express-basic-auth";
import { Express } from "express";

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TeamHub API",
      version: "1.0.0",
      description:
        "TeamHub collaboration backend API docs powered by Plannorium",
    },
    servers: [{ url: "https://teamhub-six.vercel.app" }],
  },
  apis: ["./src/modules/**/*.ts"],
});

export const setupSwagger = (app: Express) => {
  const swaggerUsername = process.env.SWAGGER_USER || "admin";
  const swaggerPassword = process.env.SWAGGER_PASSWORD || "password_#12";

  app.use(
    "/api-docs",
    basicAuth({
      users: { [swaggerUsername]: swaggerPassword },
      challenge: true,
      realm: "SwaggerDocs",
    }),
    (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>TeamHub API Docs</title>
          <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
          <style>
            .footer {
              text-align: center;
              padding: 12px 20px;
              background-color: #333;
              color: #fff;
              position: fixed;
              bottom: 0;
              width: 100%;
              left: 0;
              box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
              z-index: 100;
              font-family: sans-serif;
              font-size: 0.9em;
            }
            .footer p {
              margin: 0;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div id="swagger-ui"></div>
          <div class="footer"><p>Powered by Plannorium</p></div>
          <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
          <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
          <script>
            window.onload = () => {
              SwaggerUIBundle({
                spec: ${JSON.stringify(swaggerSpec)},
                dom_id: '#swagger-ui',
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
                ],
                layout: "StandaloneLayout"
              });
            };
          </script>
        </body>
        </html>
      `);
    }
  );
};
