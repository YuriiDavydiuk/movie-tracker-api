import { Schema, model } from 'mongoose';

const movieSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    genres: {
      type: [String],
      default: [],
    },
    releaseYear: {
      type: Number,
    },
    director: {
      type: String,
      trim: true,
    },
    durationMin: {
      type: Number,
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
    },
    tagline: {
      type: String,
      trim: true,
    },
    poster: {
      type: String,
    },
    platforms: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['plan', 'watching', 'watched'],
      default: 'plan',
    },
    myRating: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

movieSchema.index({
  status: 1,
  genres: 1,
  rating: 1,
});

export const Movie = model('Movie', movieSchema);
