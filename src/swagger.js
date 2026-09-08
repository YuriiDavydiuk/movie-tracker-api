import swaggerJsDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Movie Traker API',
      version: '1.0.0',
      description: 'Educational backend for a personal movie tracker',
    },
    servers: [
      {
        url: process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000',
        description: process.env.RENDER_EXTERNAL_URL
          ? 'Production server'
          : 'Local server',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

export const swaggerSpec = swaggerJsDoc(options);
