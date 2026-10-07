const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const dotenv = require('dotenv');
const socketHandler = require('./socket/socketHandler');
const errorHandler = require('./middleware/error');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize socket handler
const io = socketHandler(server);
module.exports.io = io; // Export io so controllers can import it

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading assets from Python service locally
}));
app.use(cors());
app.use(express.json());
app.use(mongoSanitize());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/businesses', require('./routes/business'));
app.use('/api/services', require('./routes/service'));
app.use('/api/queue', require('./routes/queue'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/grocery', require('./routes/grocery'));

// Root path
app.get('/', (req, res) => {
  res.send('QueueLess REST API and Socket.IO server is running...');
});

// Error handling middleware
app.use(errorHandler);

// Port setup
const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/queueless';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected Successfully.');

    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};

startServer();
