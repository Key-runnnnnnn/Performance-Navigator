const express = require('express');
const app = express();
const { chapterData } = require('./data.js')
require('dotenv').config();
const connectDB = require('./config/db');
const PORT = process.env.PORT || 3000;
const chapterRoutes = require('./routes/chapterRoutes');
const rateLimiter = require('./middleware/rateLimiter');

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(express.json());
app.use(rateLimiter); // Apply rate limiting to all routes
app.use('/api/v1', chapterRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});

