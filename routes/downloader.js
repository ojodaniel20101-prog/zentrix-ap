import express from 'express';
import playdl from 'play-dl';

const router = express.Router();

router.get('/yta', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      status: 400,
      message: "Query parameter 'q' is required (song name or artist)",
      powered_by: "Zentrix Tech"
    });
  }

  try {
    // 1. Search for the video using play-dl (pure JS, no Python needed)
    const results = await playdl.search(q, { limit: 1 });
    
    if (!results || results.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Song not found",
        powered_by: "Zentrix Tech"
      });
    }

    const video = results[0];

    // 2. Prepare the result using video metadata
    // Returning video.url as dl_url as requested because stream URLs expire
    const result = {
      title: video.title,
      duration: video.durationRaw,
      size: "Unknown",
      dl_url: video.url, 
      thumbnail: video.thumbnails[0]?.url || "",
      author: video.channel?.name || "Unknown",
      views: video.views || 0,
      url: video.url
    };

    res.status(200).json({
      status: 200,
      powered_by: "Zentrix Tech",
      result: result
    });

  } catch (error) {
    console.error('Error processing audio request:', error);
    res.status(500).json({
      status: 500,
      message: "Error processing your request. The service might be temporarily unavailable.",
      error: error.message,
      powered_by: "Zentrix Tech"
    });
  }
});

export { router as downloaderRouter };
