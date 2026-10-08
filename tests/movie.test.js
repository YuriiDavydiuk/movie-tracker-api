import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { Movie } from '../src/models/movie.js';
import { User } from '../src/models/user.js';
import { Session } from '../src/models/session.js';
import { createTestAgent } from './helpers/createTestAgent.js';

let mongoServer;
let agent;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  agent = createTestAgent();
  const res = await agent.post('/auth/register').send({
    email: 'movies@example.com',
    password: 'test-password',
  });
  expect(res.status).toBe(201);
});

afterEach(async () => {
  await Promise.all([Movie.deleteMany({}), User.deleteMany({}), Session.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});

describe('GET /movies', () => {
  it('returns an empty list when there are no movies', async () => {
    const res = await request(app).get('/movies');

    expect(res.status).toBe(200);
    expect(res.body.movies).toEqual([]);
    expect(res.body.totalItems).toBe(0);
  });

  it('filters by status', async () => {
    await Movie.create([
      { title: 'Movie A', status: 'watched' },
      { title: 'Movie B', status: 'plan' },
    ]);

    const res = await request(app).get('/movies?status=watched');

    expect(res.status).toBe(200);
    expect(res.body.movies).toHaveLength(1);
    expect(res.body.movies[0].title).toBe('Movie A');
  });
});

describe('GET /movies/:movieId', () => {
  it('returns a movie for a valid ID', async () => {
    const movie = await Movie.create({ title: 'Test Movie' });

    const res = await request(app).get(`/movies/${movie._id}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Movie');
  });

  it('returns 404 for a non-existent ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/movies/${fakeId}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid ID format', async () => {
    const res = await request(app).get('/movies/not-a-valid-id');

    expect(res.status).toBe(400);
  });
});

describe('POST /movies', () => {
  it('creates a movie with valid data', async () => {
    const res = await agent
      .post('/movies')
      .send({ title: 'New Movie', status: 'plan' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Movie');
  });

  it('returns 400 when title is missing', async () => {
    const res = await agent.post('/movies').send({ status: 'plan' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid genre', async () => {
    const res = await agent
      .post('/movies')
      .send({ title: 'Bad Genre Movie', genres: 'NotARealGenre' });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /movies/:movieId', () => {
  it('updates the movie status', async () => {
    const movie = await Movie.create({ title: 'To Update' });

    const res = await agent
      .patch(`/movies/${movie._id}`)
      .send({ status: 'watched' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('watched');
  });

  it('returns 400 for an empty request body', async () => {
    const movie = await Movie.create({ title: 'To Update' });

    const res = await agent.patch(`/movies/${movie._id}`).send({});

    expect(res.status).toBe(400);
  });
});

describe('DELETE /movies/:movieId', () => {
  it('deletes a movie', async () => {
    const movie = await Movie.create({ title: 'To Delete' });

    const res = await agent.delete(`/movies/${movie._id}`);

    expect(res.status).toBe(200);

    const check = await Movie.findById(movie._id);
    expect(check).toBeNull();
  });

  it('returns 404 when deleting the same movie twice', async () => {
    const movie = await Movie.create({ title: 'To Delete Twice' });
    await agent.delete(`/movies/${movie._id}`);

    const res = await agent.delete(`/movies/${movie._id}`);

    expect(res.status).toBe(404);
  });
});

