import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { downloaderRouter } from './routes/downloader.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/downloader', downloaderRouter);

// Serve frontend
app.get('/docs', (req, res) => {
  res.sendFile('/home/ubuntu/zentrix-api/index.html');
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 200,
    message: "Welcome to Zentrix API",
    powered_by: "Zentrix Tech"
  });
});

// Error handling for 404
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: "Endpoint not found",
    powered_by: "Zentrix Tech"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 500,
    message: "Internal Server Error",
    powered_by: "Zentrix Tech"
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
