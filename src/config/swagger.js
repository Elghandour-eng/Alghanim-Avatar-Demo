import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Alghanim-Avatar-Demo API",
      version: "1.0.0",
      description: "API documentation for the Alghanim-Avatar-Demo project",
    },
    servers: [
      {
        url: "http://localhost:3001",
      },
    ],
  },
  apis: ["./src/routes/*.js"], // files containing annotations as above
};

const specs = swaggerJsdoc(options);
export default specs;
