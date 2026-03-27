const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const resultRoutes = require('./routes/resultRoutes');
const adminRoutes = require('./routes/adminRoutes');
// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

const path = require('path');
const discrepancyRoutes = require('./routes/discrepancyRoutes');

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend server is running correctly' });
});

// Serve static files from the uploads directory securely
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/results', resultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/discrepancies', discrepancyRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
