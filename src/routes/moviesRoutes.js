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

router.get('/movies', celebrate(getMoviesSchema), getMovies);
router.get('/movies/:movieId', celebrate(movieIdParamSchema), getMovieById);
router.post('/movies', celebrate(createMovieSchema), createMovie);
router.delete('/movies/:movieId', celebrate(movieIdParamSchema), deleteMovie);
router.patch('/movies/:movieId', celebrate(updateMovieSchema), updateMovie);

export default router;
