import express from 'express';
import yts from 'yt-search';
import play from 'play-dl';

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
    // 1. Search for the video using yt-search (very reliable)
    const searchResults = await yts(q);
    const video = searchResults.videos[0];

    if (!video) {
      return res.status(404).json({
        status: 404,
        message: "Song not found",
        powered_by: "Zentrix Tech"
      });
    }

    // 2. Try to get stream URL using play-dl with search (sometimes search bypasses better)
    let dl_url = "";
    try {
        // play.search is sometimes more resilient than play.stream(url)
        const playSearch = await play.search(q, { limit: 1 });
        if (playSearch.length > 0) {
            const stream = await play.stream(playSearch[0].url, {
                quality: 0,
                discordPlayerCompatibility: true
            });
            dl_url = stream.url;
        } else {
            // Fallback to the yt-search result
            const stream = await play.stream(video.url, {
                quality: 0,
                discordPlayerCompatibility: true
            });
            dl_url = stream.url;
        }
    } catch (err) {
        console.error("Extraction failed:", err.message);
        // Last resort: Return a message indicating rate limit
        return res.status(429).json({
            status: 429,
            message: "YouTube is currently rate-limiting the server. Please try again in a few minutes.",
            powered_by: "Zentrix Tech"
        });
    }

    const result = {
      title: video.title,
      duration: video.timestamp,
      size: "Unknown",
      dl_url: dl_url,
      thumbnail: video.thumbnail,
      author: video.author.name,
      views: video.views,
      url: video.url
    };

    res.status(200).json({
      status: 200,
      powered_by: "Zentrix Tech",
      result: result
    });

  } catch (error) {
    console.error('General error:', error);
    res.status(500).json({
      status: 500,
      message: "Error processing your request.",
      powered_by: "Zentrix Tech"
    });
  }
});

export { router as downloaderRouter };
