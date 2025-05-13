import { createSwaggerSpec } from 'next-swagger-doc';

export const getSwaggerSpec = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Job portal apis',
        version: '1.0.0',
        description: 'API documentation for Job portal project',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'Authorization',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
  });

  return spec;
};
