import express from 'express';
import youtubedl from 'youtube-dl-exec';

const router = express.Router();

router.get('/yta', async (req, res) => {
  const { q, quality = '128k' } = req.query;

  if (!q) {
    return res.status(400).json({
      status: 400,
      message: "Query parameter 'q' is required (song name or artist)",
      powered_by: "Zentrix Tech"
    });
  }

  try {
    // Use youtube-dl-exec which calls the binary
    // Search for the video and get info
    const info = await youtubedl(`ytsearch1:${q}`, {
      dumpJson: true,
      noPlaylist: true,
      // Use some flags to try and bypass 429 if possible
      noCheckCertificates: true,
      preferFreeFormats: true,
      addHeader: [
        'referer:https://www.google.com/',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ]
    });

    if (!info || !info.entries || info.entries.length === 0) {
      // Sometimes it returns the object directly instead of entries
      const video = info.entries ? info.entries[0] : info;
      
      if (!video) {
        return res.status(404).json({
          status: 404,
          message: "Song not found",
          powered_by: "Zentrix Tech"
        });
      }
      
      return sendResponse(res, video);
    }

    sendResponse(res, info.entries[0]);

  } catch (error) {
    console.error('Error extracting audio:', error);
    res.status(500).json({
      status: 500,
      message: "Error extracting audio from YouTube. The service might be temporarily rate-limited.",
      powered_by: "Zentrix Tech"
    });
  }
});

function sendResponse(res, video) {
  const result = {
    title: video.title,
    duration: formatDuration(video.duration),
    size: video.filesize ? formatSize(video.filesize) : (video.filesize_approx ? formatSize(video.filesize_approx) : "Unknown"),
    dl_url: video.url, // This is usually the direct stream URL
    thumbnail: video.thumbnail
  };

  res.status(200).json({
    status: 200,
    powered_by: "Zentrix Tech",
    result: result
  });
}

function formatDuration(seconds) {
  if (!seconds) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatSize(bytes) {
  if (!bytes) return "Unknown";
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export { router as downloaderRouter };
