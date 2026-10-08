import { Movie } from '../models/movie.js';
import createHttpError from 'http-errors';

export const getMovies = async (req, res) => {
  const {
    page = 1,
    perPage = 10,
    genres,
    minRating,
    maxRating,
    status,
    rated,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const skip = (page - 1) * perPage;
  const moviesQuery = Movie.find();

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    moviesQuery.where({ title: { $regex: escapedSearch, $options: 'i' } });
  }
  if (genres) {
    moviesQuery.where('genres').in(genres.split(',').map((g) => g.trim()));
  }
  if (status) {
    moviesQuery.where('status').equals(status);
  }
  if (minRating !== undefined) {
    moviesQuery.where('rating').gte(minRating);
  }
  if (maxRating !== undefined) {
    moviesQuery.where('rating').lte(maxRating);
  }

  if (rated !== undefined) {
    moviesQuery.where('myRating').equals(rated ? { $ne: null } : null);
  }

  const [totalItems, movies] = await Promise.all([
    moviesQuery.clone().countDocuments(),
    moviesQuery
      .sort({ [sortBy]: sortOrder, _id: 1 })
      .skip(skip)
      .limit(perPage),
  ]);

  const totalPages = Math.ceil(totalItems / perPage);

  res.status(200).json({
    page,
    perPage,
    totalItems,
    totalPages,
    movies,
  });
};

export const getMovieById = async (req, res) => {
  const { movieId } = req.params;
  const movie = await Movie.findById(movieId);

  if (!movie) {
    throw createHttpError(404, 'Movie not found');
  }
  res.status(200).json(movie);
};

export const createMovie = async (req, res) => {
  const movie = await Movie.create(req.body);
  res.status(201).json(movie);
};

export const deleteMovie = async (req, res) => {
  const { movieId } = req.params;
  const movie = await Movie.findOneAndDelete({
    _id: movieId,
  });

  if (!movie) {
    throw createHttpError(404, 'Movie not found');
  }

  res.status(200).json(movie);
};

export const updateMovie = async (req, res) => {
  const { movieId } = req.params;
  const movie = await Movie.findOneAndUpdate({ _id: movieId }, req.body, {
    returnDocument: 'after',
  });

  if (!movie) {
    throw createHttpError(404, 'Movie not found');
  }

  res.status(200).json(movie);
};
