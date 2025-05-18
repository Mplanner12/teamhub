import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
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
    // servers: [{ url: "http://localhost:8000" }],
    servers: [{ url: "https://teamhub-six.vercel.app/" }],
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
    })
  );

  const swaggerUiOptions = {
    swaggerOptions: {
      spec: swaggerSpec,
    },
    customCss: `
      .swagger-ui .footer {
        text-align: center;
        padding: 12px 20px; /* Slightly more padding */
        background-color: #333; /* Darker, more 'premium' background */
        color: #ffffff;
        position: fixed; /* Stick to the bottom */
        bottom: 0;
        width: 100%;
        left: 0; /* Ensure it spans full width with fixed positioning */
        box-shadow: 0 -2px 5px rgba(0,0,0,0.1); /* Subtle shadow on top */
        z-index: 100; /* Ensure it's above other content if necessary */
        font-family: sans-serif; /* A common clean font */
        font-size: 0.9em;
      }
      .swagger-ui .footer p {
        margin: 0;
        line-height: 1.4;
      }
    `,
    customJsStr: `
      (function() {
        const addCustomFooter = () => {
          try {
            const swaggerUiContainer = document.querySelector('.swagger-ui');
            if (swaggerUiContainer) {
              // Prevent adding multiple footers if Swagger UI re-renders
              if (swaggerUiContainer.querySelector('.footer')) {
                return;
              }
              const footer = document.createElement('div');
              footer.className = 'footer';
              footer.innerHTML = '<p>Powered by Plannorium</p>';
              swaggerUiContainer.appendChild(footer);
              console.log('Custom Swagger footer successfully added.');
            } else {
              // If container not found yet, try again shortly
              console.log('Swagger UI container (.swagger-ui) not found, retrying to add footer...');
              setTimeout(addCustomFooter, 500); // Retry after 500ms
            }
          } catch (e) {
            console.error('Error in Swagger customJs (addCustomFooter):', e);
          }
        };
        // Start the process of adding the footer
        addCustomFooter();
      })();
    `,
  };

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(null, swaggerUiOptions) // Pass null as the first argument for spec
  );
};
