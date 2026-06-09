const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const courseRoutes = require('./routes/courseRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve static uploads
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/courses', courseRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error('[COURSE SERVICE ERROR]', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5007;
const MONGO_URI = process.env.MONGO_URI_COURSE || process.env.MONGO_URI || 'mongodb://localhost:27017/medicojob_course';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Course Service DB Connected');
    app.listen(PORT, () => {
      console.log(`Course Service running on port ${PORT}`);
    });
  })
  .catch(err => console.error('Course Service DB Connection Error:', err));
