import express from 'express';
import axios from 'axios';

const router = express.Router();
const BASE_URL = 'https://api.drexapp.space';

/**
 * Helper function to handle proxy requests
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @param {string} endpoint 
 */
async function proxyRequest(req, res, endpoint) {
  try {
    // Forward all query parameters
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      params: req.query,
      timeout: 15000, // 15s timeout
      headers: {
        'User-Agent': 'ZentrixAPI/1.0 (Proxy; Zentrix Tech)'
      }
    });

    // Return in Zentrix format
    res.status(200).json({
      status: 200,
      powered_by: "Zentrix Tech",
      result: response.data
    });

  } catch (error) {
    console.error(`Proxy Error [${endpoint}]:`, error.message);
    
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || "External API Error";

    res.status(statusCode).json({
      status: statusCode,
      message: errorMessage,
      powered_by: "Zentrix Tech"
    });
  }
}

// Define all proxy routes
// Note: index.js mounts this router at /downloader
// So we define routes relative to that.
const endpoints = [
  'yta',
  'ytastream',
  'ytv',
  'tiktok',
  'twitter',
  'facebook',
  'facebookv2',
  'gdrive',
  'npm',
  'spotify',
  'github',
  'pinterest',
  'instagram'
];

endpoints.forEach(endpoint => {
  router.get(`/${endpoint}`, (req, res) => {
    proxyRequest(req, res, `/downloader/${endpoint}`);
  });
});

export { router as downloaderRouter };
