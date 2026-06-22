const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
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

app.listen(PORT, () => {
  console.log(`Course Service running on port ${PORT}`);
});
