import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { errors } from 'celebrate';

import { swaggerSpec } from './swagger.js';
import { logger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import moviesRoutes from './routes/moviesRoutes.js';

const app = express();

app.use(logger);
app.use(express.json());
app.use(cors());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(moviesRoutes);

app.use(notFoundHandler);
app.use(errors());
app.use(errorHandler);

export default app;
