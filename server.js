const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const courseRoutes = require('./routes/courseRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static uploads
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/courses', courseRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error('[COURSE SERVICE ERROR]', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5007;
const MONGO_URI = process.env.MONGO_URI_COURSE || process.env.MONGO_URI || 'mongodb://localhost:27017/medicojob_course';

if (!MONGO_URI) {
  console.error('Course Service DB Connection Error: MONGO_URI_COURSE or MONGO_URI is required');
  process.exit(1);
}

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log('Course Service DB Connected');
    app.listen(PORT, () => {
      console.log(`Course Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Course Service DB Connection Error:', err);
    process.exit(1);
  });
