const error = { $ref: '#/components/schemas/Error' };
const bearer = [{ bearerAuth: [] }];
const json = (schema: object) => ({ content: { 'application/json': { schema } } });
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer' } };

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Lumen API',
    version: '1.0.0',
    description:
      'REST API for the Lumen TV catalog. Log in with the demo account (demo@lumen.dev / demo1234), copy the token and press Authorize to try protected endpoints.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'validation_error' },
              message: { type: 'string' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'editor'] },
        },
      },
      Auth: {
        type: 'object',
        properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } },
      },
      TitleInput: {
        type: 'object',
        required: ['title', 'year', 'genre', 'durationMinutes', 'description', 'streamUrl'],
        properties: {
          title: { type: 'string', example: 'Sintel' },
          year: { type: 'integer', example: 2010 },
          genre: {
            type: 'string',
            enum: ['Action', 'Comedy', 'Drama', 'Fantasy', 'Horror Comedy', 'Sci-Fi', 'Documentary'],
          },
          durationMinutes: { type: 'integer', example: 15 },
          description: { type: 'string', example: 'A lone young woman searches for the baby dragon she raised.' },
          streamUrl: { type: 'string', example: 'https://example.com/sintel/playlist.m3u8' },
          status: { type: 'string', enum: ['published', 'draft', 'archived'] },
        },
      },
      Title: {
        allOf: [
          { $ref: '#/components/schemas/TitleInput' },
          {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              slug: { type: 'string' },
              views: { type: 'integer' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an editor account',
        requestBody: json({
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string', minLength: 8 } },
        }),
        responses: {
          201: { description: 'Account created', ...json({ $ref: '#/components/schemas/Auth' }) },
          400: { description: 'Validation error', ...json(error) },
          409: { description: 'Email already registered', ...json(error) },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and get a JWT',
        requestBody: json({
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'demo@lumen.dev' },
            password: { type: 'string', example: 'demo1234' },
          },
        }),
        responses: {
          200: { description: 'Logged in', ...json({ $ref: '#/components/schemas/Auth' }) },
          401: { description: 'Wrong email or password', ...json(error) },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user',
        security: bearer,
        responses: { 200: { description: 'Current user' }, 401: { description: 'Not logged in', ...json(error) } },
      },
    },
    '/titles': {
      get: {
        tags: ['Titles'],
        summary: 'List titles with search, filters, sorting and pagination',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'genre', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['published', 'draft', 'archived'] } },
          {
            name: 'sort',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['title', '-title', 'year', '-year', 'views', '-views', 'createdAt', '-createdAt'],
              default: '-views',
            },
          },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: { 200: { description: 'Paginated list of titles' }, 400: { description: 'Invalid query', ...json(error) } },
      },
      post: {
        tags: ['Titles'],
        summary: 'Create a title',
        security: bearer,
        requestBody: json({ $ref: '#/components/schemas/TitleInput' }),
        responses: {
          201: { description: 'Created' },
          400: { description: 'Validation error', ...json(error) },
          401: { description: 'Not logged in', ...json(error) },
        },
      },
    },
    '/titles/{id}': {
      get: {
        tags: ['Titles'],
        summary: 'Get one title',
        parameters: [idParam],
        responses: { 200: { description: 'Title' }, 404: { description: 'Not found', ...json(error) } },
      },
      patch: {
        tags: ['Titles'],
        summary: 'Update a title',
        security: bearer,
        parameters: [idParam],
        requestBody: json({ $ref: '#/components/schemas/TitleInput' }),
        responses: {
          200: { description: 'Updated' },
          400: { description: 'Validation error', ...json(error) },
          404: { description: 'Not found', ...json(error) },
        },
      },
      delete: {
        tags: ['Titles'],
        summary: 'Delete a title (admin only)',
        security: bearer,
        parameters: [idParam],
        responses: {
          204: { description: 'Deleted' },
          403: { description: 'Not an admin', ...json(error) },
          404: { description: 'Not found', ...json(error) },
        },
      },
    },
    '/stats': {
      get: {
        tags: ['Stats'],
        summary: 'Catalog totals, views by genre and titles by status',
        responses: { 200: { description: 'Catalog statistics' } },
      },
    },
  },
};
