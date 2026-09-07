import { Joi, Segments } from 'celebrate';
import { isValidObjectId } from 'mongoose';

const GENRES = [
  'Drama',
  'Action',
  'Comedy',
  'Sci-Fi',
  'Horror',
  'Thriller',
  'Romance',
  'Animation',
  'Fantasy',
  'Documentary',
  'Adventure',
  'Crime',
  'Mystery',
  'Family',
  'Musical',
];

const objectIdValidator = (value, helpers) => {
  return !isValidObjectId(value) ? helpers.message('Invalid format') : value;
};

const genresValidator = (value, helpers) => {
  const genres = value.split(',').map((g) => g.trim());
  const invalid = genres.filter((g) => !GENRES.includes(g));

  if (invalid.length > 0) {
    return helpers.message(`Invalid genre(s): ${invalid.join(', ')}`);
  }

  return value;
};

const movieFields = {
  title: Joi.string().min(1).max(100).messages({
    'string.empty': 'Movie title cannot be empty',
    'string.max': 'Title is too long (max 100 characters)',
    'any.required': 'Movie title is required',
  }),
  genres: Joi.array()
    .items(Joi.string().valid(...GENRES))
    .min(1)
    .messages({
      'array.min': 'Select at least one genre',
      'any.only': 'Invalid genre',
    }),
  releaseYear: Joi.number()
    .integer()
    .min(1888)
    .max(new Date().getFullYear() + 1)
    .messages({
      'number.base': 'Release year must be a number',
      'number.min': 'Release year cannot be earlier than 1888',
      'number.max': 'Release year cannot be in the future',
    }),
  director: Joi.string().allow(''),
  durationMin: Joi.number().integer().min(1).messages({
    'number.base': 'Duration must be a number (in minutes)',
    'number.min': 'Duration must be greater than 0',
  }),
  rating: Joi.number().min(0).max(10).messages({
    'number.min': 'Rating cannot be less than 0',
    'number.max': 'Rating cannot be greater than 10',
  }),
  tagline: Joi.string().allow(''),
  poster: Joi.string().uri().messages({
    'string.uri': 'Poster must be a valid URL',
  }),
  platforms: Joi.array().items(Joi.string()),
  status: Joi.string().valid('plan', 'watching', 'watched').messages({
    'any.only': 'Status must be one of: plan, watching, watched',
  }),
  myRating: Joi.number().min(1).max(10).messages({
    'number.min': 'Rating must be between 1 and 10',
    'number.max': 'Rating must be between 1 and 10',
  }),
};

export const movieIdParamSchema = {
  [Segments.PARAMS]: Joi.object({
    movieId: Joi.string().custom(objectIdValidator).required(),
  }),
};

export const createMovieSchema = {
  [Segments.BODY]: Joi.object({
    ...movieFields,
    title: movieFields.title.required(),
  }),
};

export const updateMovieSchema = {
  [Segments.PARAMS]: Joi.object({
    movieId: Joi.string().custom(objectIdValidator).required(),
  }),
  [Segments.BODY]: Joi.object(movieFields).min(1).messages({
    'object.min': 'At least one field is required to update',
  }),
};

export const getMoviesSchema = {
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(20).default(10),
    genres: Joi.string().custom(genresValidator),
    minRating: Joi.number().min(0).max(10),
    maxRating: Joi.number().min(0).max(10),
    status: Joi.string().valid('plan', 'watching', 'watched'),
    rated: Joi.boolean(),
    search: Joi.string().trim().allow(''),
    sortBy: Joi.string()
      .valid('title', 'releaseYear', 'rating', 'myRating', 'createdAt')
      .default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};
