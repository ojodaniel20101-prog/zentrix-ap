import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

/**
 * Twitter Scraper for twdown.net
 * @param {string} twitterUrl 
 */
async function scrapeTwitter(twitterUrl) {
  try {
    const formattedUrl = twitterUrl.replace('x.com', 'twitter.com');
    const params = new URLSearchParams();
    params.append('URL', formattedUrl);

    const response = await axios.post('https://twdown.net/download.php', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://twdown.net/index.php',
        'Origin': 'https://twdown.net'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Check if error message exists
    const errorAlert = $('.alert-danger').text();
    if (errorAlert && errorAlert.includes("couldn't find the video")) {
      throw new Error("Video not found or invalid URL");
    }

    // Extract Title/Description
    const title = $('div.col-md-6 h4 strong').text().trim() || 
                  $('div.col-md-6 p').first().text().trim() || 
                  "Twitter Video";

    // Extract Download Links
    const downloadLinks = [];
    $('table.table tbody tr').each((i, el) => {
      const quality = $(el).find('td').eq(1).text().trim();
      const type = $(el).find('td').eq(2).text().trim();
      const url = $(el).find('td').eq(3).find('a').attr('href');

      if (url && type === 'MP4') {
        downloadLinks.push({ quality: parseInt(quality) || 0, url });
      }
    });

    // Sort by quality descending to get the best one
    downloadLinks.sort((a, b) => b.quality - a.quality);

    const dl_url = downloadLinks.length > 0 ? downloadLinks[0].url : null;
    
    // Audio URL (MP3)
    let audio_url = null;
    const audioLink = $('table.table tbody tr').find('a[href^="mp3.php"]').attr('href');
    if (audioLink) {
      audio_url = audioLink.startsWith('http') ? audioLink : `https://twdown.net/${audioLink}`;
    }

    if (!dl_url && !audio_url) {
      throw new Error("Could not extract download links");
    }

    return {
      title,
      dl_url,
      audio_url
    };
  } catch (error) {
    throw error;
  }
}

// Custom Twitter Route
router.get('/twitter', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: 400,
      message: "Twitter URL is required",
      powered_by: "Zentrix Tech"
    });
  }

  try {
    const result = await scrapeTwitter(url);
    res.status(200).json({
      status: 200,
      powered_by: "Zentrix Tech",
      result: result
    });
  } catch (error) {
    console.error(`Twitter Scrape Error:`, error.message);
    res.status(500).json({
      status: 500,
      message: error.message || "Failed to scrape Twitter video",
      powered_by: "Zentrix Tech"
    });
  }
});

// Define all other proxy routes
const endpoints = [
  'yta',
  'ytastream',
  'ytv',
  'tiktok',
  // 'twitter', // Handled separately above
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
