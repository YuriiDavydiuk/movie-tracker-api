import 'dotenv/config';
import app from './app.js';
import { connectMongoDB } from './db/connectMongoDB.js';

const PORT = process.env.PORT || 3000;

await connectMongoDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
