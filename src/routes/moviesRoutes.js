import { Router } from 'express';
import { celebrate } from 'celebrate';
import {
  createMovieSchema,
  movieIdParamSchema,
  updateMovieSchema,
  getMoviesSchema,
} from '../validations/moviesValidation.js';
import {
  getMovies,
  getMovieById,
  createMovie,
  deleteMovie,
  updateMovie,
} from '../controllers/movieController.js';

const router = Router();

/**
 * @swagger
 * /movies:
 *   get:
 *     summary: Get a paginated list of movies with search and filters
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: perPage
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: genres
 *         schema: { type: string }
 *         description: Comma-separated genres, e.g. Drama,Action
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [plan, watching, watched] }
 *       - in: query
 *         name: minRating
 *         schema: { type: number, minimum: 0, maximum: 10 }
 *       - in: query
 *         name: maxRating
 *         schema: { type: number, minimum: 0, maximum: 10 }
 *       - in: query
 *         name: rated
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [title, releaseYear, rating, myRating, createdAt] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Paginated list of movies
 */
router.get('/movies', celebrate(getMoviesSchema), getMovies);

/**
 * @swagger
 * /movies/{movieId}:
 *   get:
 *     summary: Get a movie by ID
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Movie found
 *       404:
 *         description: Movie not found
 */
router.get('/movies/:movieId', celebrate(movieIdParamSchema), getMovieById);

/**
 * @swagger
 * /movies:
 *   post:
 *     summary: Add a new movie
 *     tags: [Movies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               genres: { type: array, items: { type: string } }
 *               releaseYear: { type: integer }
 *               director: { type: string }
 *               durationMin: { type: integer }
 *               rating: { type: number, minimum: 0, maximum: 10 }
 *               tagline: { type: string }
 *               poster: { type: string }
 *               platforms: { type: array, items: { type: string } }
 *               status: { type: string, enum: [plan, watching, watched] }
 *               myRating: { type: integer, minimum: 1, maximum: 10 }
 *     responses:
 *       201:
 *         description: Movie created
 *       400:
 *         description: Validation error
 */
router.post('/movies', celebrate(createMovieSchema), createMovie);

/**
 * @swagger
 * /movies/{movieId}:
 *   delete:
 *     summary: Delete a movie
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Movie deleted
 *       404:
 *         description: Movie not found
 */
router.delete('/movies/:movieId', celebrate(movieIdParamSchema), deleteMovie);

/**
 * @swagger
 * /movies/{movieId}:
 *   patch:
 *     summary: Update a movie (status, rating, etc.)
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [plan, watching, watched] }
 *               myRating: { type: integer, minimum: 1, maximum: 10 }
 *     responses:
 *       200:
 *         description: Movie updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Movie not found
 */
router.patch(
  '/movies/:movieId',
  celebrate(movieIdParamSchema),
  celebrate(updateMovieSchema),
  updateMovie,
);

export default router;
