// Vercel serverless entry point. Vercel routes every /api/* request into
// this file (see vercel.json), which simply hands off to the Express app.
// Locally, `npm run dev`/`npm start` still runs index.js directly with
// app.listen(), so nothing changes about local development.
import app from '../index.js';

export default app;
