"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swaggerSpec = (0, swagger_jsdoc_1.default)({
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
fs_1.default.writeFileSync("./swagger.json", JSON.stringify(swaggerSpec, null, 2));
