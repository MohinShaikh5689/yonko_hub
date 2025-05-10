// anime-api.js - Express server for anime streaming API
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Base URL for Consumet API
const CONSUMET_API = 'https://consumate-api-eight.vercel.app/';

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// 1. Search anime endpoint
app.get('/api/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const response = await axios.get(`${CONSUMET_API}/meta/anilist/${encodeURIComponent(query)}`);
    res.json(response.data.results || []);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Failed to search anime' });
  }
});

// 2. Get anime info endpoint - Updated to support provider selection
app.get('/api/info/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const provider = req.query.provider || 'animepahe'; // Default to animepahe if not specified
    console.log(`Getting info for ID ${id} with provider: ${provider}`);
    
    const response = await axios.get(`${CONSUMET_API}/meta/anilist/info/${id}?provider=${provider}`);
    res.json(response.data);
  } catch (error) {
    console.error('Info error:', error.message);
    res.status(500).json({ error: 'Failed to fetch anime info' });
  }
});

// 3. Get episodes endpoint - Updated to support provider selection
app.get('/api/episodes/:id', async (req, res) => {
    const provider = req.query.provider || 'animepahe'; // Default to animepahe if not specified
    console.log(`Fetching episodes for ID ${req.params.id} with provider: ${provider}`);
  try {
    const { id } = req.params;
    const response = await axios.get(
      `${CONSUMET_API}/meta/anilist/episodes/${id}?provider=${provider}`
    );
    res.json(response.data || []);
  } catch (error) {
    console.error('Episodes error:', error.message);
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
});

// 4. Get streaming sources endpoint - Updated to support both animepahe and zoro
app.get('/api/watch/:animeId/:episodeId', async (req, res) => {
  try {
    const { animeId, episodeId } = req.params;
    const provider = req.query.provider || 'animepahe'; // Default to animepahe if not specified
    console.log(`Fetching streaming sources with provider: ${provider}`);

    if (provider === 'animepahe') {
      // AnimePahe specific handling
      const Id = animeId + '/' + episodeId; // Combine animeId and episodeId for AnimePahe
      console.log('Combined ID for AnimePahe:', Id);
      
      // Try first method (meta API)
      try {
        const metaResponse = await axios.get(
          `${CONSUMET_API}/anime/animepahe/watch?episodeId=${Id}`
        );
        
        if (metaResponse.data && metaResponse.data.sources && metaResponse.data.sources.length) {
          return res.json(metaResponse.data);
        }
      } catch (err) {
        console.log('Meta API streaming failed, trying direct API');
      }
      
      // Try second method (direct API)
      const directResponse = await axios.get(
        `${CONSUMET_API}/anime/animepahe/watch?episodeId=${episodeId}`
      );
      
      res.json(directResponse.data);
    } 
    else {
      // Unsupported provider
      return res.status(400).json({ error: `Provider "${provider}" is not supported` });
    }
  } catch (error) {
    console.error('Streaming error:', error.message);
    res.status(500).json({ error: 'Failed to fetch streaming sources' });
  }
});

// 5. New endpoint for direct Zoro search (in addition to AniList)
app.get('/api/zoro/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    console.log(`Direct Zoro search for: ${query}`);
    
    const response = await axios.get(`${CONSUMET_API}/anime/zoro/${encodeURIComponent(query)}`);
    res.json(response.data.results || []);
  } catch (error) {
    console.error('Zoro search error:', error.message);
    res.status(500).json({ error: 'Failed to search anime on Zoro' });
  }
});

app.get('/api/zoro/:episodeId', async (req, res) => {
  const { episodeId } = req.params;
  console.log(`Fetching Zoro streaming for episode ID: ${episodeId}`);
  try {
    // For Zoro, we use the episodeId directly
    const zoroResponse = await axios.get(
      `${CONSUMET_API}/anime/zoro/watch?episodeId=${episodeId}`
    );
    
    if (zoroResponse.data) {
      return res.json(zoroResponse.data);
    } else {
      return res.status(404).json({ error: 'No sources found on Zoro' });
    }
  } catch (error) {
    console.error('Zoro streaming error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch streaming from Zoro' });
  }
});

// Improved proxy endpoint with better binary data handling
app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  const referer = req.query.referer || req.headers.referer || "https://kwik.si/";
  
  // Better detection for all media types
  const decodedUrl = decodeURIComponent(targetUrl?.toString() || '');
  const isM3U8 = decodedUrl.toLowerCase().endsWith('.m3u8');
  const isKeyFile = decodedUrl.toLowerCase().endsWith('.key');
  const isSegmentFile = /\.(ts|m4s|mp4|m4v)(\?|$)/i.test(decodedUrl);
  const isImageFile = /\.(jpg|jpeg|png)(\?|$)/i.test(decodedUrl);
  
  if (!targetUrl) {
      return res.status(400).send("Missing targetUrl");
  }

  console.log(`Proxying ${isM3U8 ? 'M3U8' : isKeyFile ? 'KEY' : isSegmentFile ? 'SEGMENT' : isImageFile ? 'IMAGE' : 'FILE'}: ${decodedUrl.substring(0, 100)}...`);

  try {
      // Always set CORS headers first for every response
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');

      // Always use arraybuffer for binary files to prevent corruption
      const useArrayBuffer = isM3U8 || isKeyFile || isImageFile || isSegmentFile;
      
      const response = await axios({
          method: 'get',
          url: decodedUrl,
          responseType: useArrayBuffer ? "arraybuffer" : "stream",
          headers: {
              'Referer': referer,
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
              'Origin': new URL(referer).origin,
              'Accept': '*/*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Range': req.headers.range || '',
              'Sec-Fetch-Dest': isSegmentFile ? 'video' : isImageFile ? 'image' : 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'cross-site',
          },
          timeout: 30000,
          maxRedirects: 5,
          decompress: !useArrayBuffer,
          validateStatus: (status) => status >= 200 && status < 500,
      });

      // Better handling for binary data
      if (useArrayBuffer) {
          // Determine the appropriate content type as requested
          let contentType;
          
          if (isM3U8) {
              contentType = 'application/vnd.apple.mpegurl';
          } else if (isKeyFile) {
              contentType = 'application/octet-stream';
          } else if (isImageFile) {
              if (response.headers['content-type']) {
                  contentType = response.headers['content-type'];
              } else if (decodedUrl.includes('.jpg') || decodedUrl.includes('.jpeg')) {
                  contentType = 'image/jpeg';
              } else if (decodedUrl.includes('.png')) {
                  contentType = 'image/png';
              } else {
                  contentType = 'image/jpeg'; // Default
              }
          } else if (isSegmentFile) {
              // As requested, use video/mp4 for video segments
              contentType = 'video/mp4';
          } else {
              contentType = response.headers['content-type'] || 'application/octet-stream';
          }

          // Pass through status code from source
          res.status(response.status);

          // Set content-specific headers
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Length', response.data.byteLength);
          
          // Handle range requests
          if (req.headers.range && response.headers['content-range']) {
              res.status(206);
              res.setHeader('Accept-Ranges', 'bytes');
              res.setHeader('Content-Range', response.headers['content-range']);
          }

          return res.send(Buffer.from(response.data));
      }
      
      // Handle non-binary files with streaming
      // Copy important headers for streaming
      Object.entries(response.headers).forEach(([key, value]) => {
          // Skip problematic headers
          if (!key.toLowerCase().startsWith('access-control') && 
              !['content-encoding', 'transfer-encoding', 'connection', 
                'content-security-policy'].includes(key.toLowerCase())) {
              res.setHeader(key, value);
          }
      });

      // Always ensure CORS and content type headers are set correctly
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Handle range requests
      if (req.headers.range && response.headers['content-range']) {
          res.status(206);
          res.setHeader('Accept-Ranges', 'bytes');
      } else {
          res.status(response.status);
      }

      // Stream the response
      response.data.pipe(res);
  } catch (error) {
      console.error("Proxy error:", error.message);
      if (error.response) {
          console.error(`Response status: ${error.response.status}`);
          console.error(`Response URL: ${error.config?.url || 'unknown'}`);
      }
      res.status(500).send("Proxy failed: " + error.message);
  }
});

// Enhanced HLS proxy for m3u8 manifest files with improved segment handling
app.get('/api/hls-proxy', async (req, res) => {
  try {
      const { url, referer, debug } = req.query;
      if (!url) {
          return res.status(400).send('Missing URL parameter');
      }

      const isM3U8 = url.toString().toLowerCase().endsWith('.m3u8');
      const requestUrl = decodeURIComponent(url.toString());
      
      console.log(`[M3U8 Proxy] Processing ${isM3U8 ? 'M3U8' : 'segment'}: ${requestUrl.substring(0, 100)}...`);
      
      // Always set CORS headers first for every response
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');
      
      // Always set content type based on if it's an M3U8 or not
      res.setHeader('Content-Type', isM3U8 ? 'application/vnd.apple.mpegurl' : 'video/mp4');
      
      // Special domain handling for referers
      const parsedUrl = new URL(requestUrl);
      let effectiveReferer = referer;
      
      // Handle specific domains that need special referer handling
      if (!effectiveReferer) {
          // Known domains that need specific referer values
          if (parsedUrl.hostname.includes('padorupado.ru')) {
              effectiveReferer = 'https://kwik.si/';
          } else if (parsedUrl.hostname.includes('kwik')) {
              effectiveReferer = 'https://kwik.si/';
          } else {
              effectiveReferer = `https://${parsedUrl.hostname}/`;
          }
      }
      
      // Implement retry logic with exponential backoff
      let attempts = 0;
      const maxAttempts = 3;
      let response;

      while (attempts < maxAttempts) {
          try {
              attempts++;
              console.log(`HLS Proxy attempt ${attempts} for ${requestUrl.substring(0, 50)}...`);
              
              response = await axios({
                  method: 'get',
                  url: requestUrl,
                  headers: {
                      'Referer': effectiveReferer,
                      'Origin': new URL(effectiveReferer).origin,
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
                      'Accept': '*/*',
                      'Accept-Language': 'en-US,en;q=0.9',
                      'Range': req.headers.range || '',
                      'Connection': 'keep-alive',
                      'Sec-Fetch-Dest': 'empty',
                      'Sec-Fetch-Mode': 'cors',
                      'Sec-Fetch-Site': 'cross-site',
                      'Pragma': 'no-cache',
                      'Cache-Control': 'no-cache',
                  },
                  responseType: isM3U8 ? 'text' : 'arraybuffer',
                  timeout: 60000, // 60 seconds
                  maxRedirects: 5,
                  validateStatus: function (status) {
                      return status >= 200 && status < 500;
                  }
              });
              break;
          } catch (retryError) {
              console.error(`Attempt ${attempts} failed: ${retryError.message}`);
              if (attempts >= maxAttempts) throw retryError;
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
      }

      if (response.status >= 400) {
          console.error(`HLS proxy received error status ${response.status} from remote server`);
          return res.status(response.status).send(`Remote server returned error: ${response.status}`);
      }

      if (isM3U8) {
          if (!response.data || typeof response.data !== 'string') {
              console.error('Invalid M3U8 data received:', typeof response.data);
              return res.status(500).send('Invalid M3U8 data received from server');
          }

          let playlist = response.data;
          const baseUrl = new URL(requestUrl);
          const basePath = baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1);
          
          if (debug === '1') {
              console.log('ORIGINAL PLAYLIST:', playlist);
          }
          
          // Ensure we actually have a valid M3U8 file
          if (!playlist.includes('#EXTM3U')) {
              console.error('Invalid M3U8 file received (no #EXTM3U header)');
              console.error('Response content:', playlist.substring(0, 300));
              return res.status(500).send('Invalid M3U8 file received (no #EXTM3U header)');
          }
          
          // Process all segment files (including jpg/jpeg which were causing issues)
          playlist = playlist.replace(/^(?!#)([^\s]+)(\.ts|\.jpg|\.jpeg|\.png|\.mp4|\.m4s|\.key)(\?[^\s]*)?$/gm, (match) => {
              // Convert to absolute URL
              const fullUrl = match.startsWith('http')
                  ? match
                  : match.startsWith('/')
                    ? `${baseUrl.origin}${match}`
                    : `${baseUrl.origin}${basePath}${match}`;
                    
              return `/api/proxy?url=${encodeURIComponent(fullUrl)}&referer=${encodeURIComponent(effectiveReferer)}`;
          });
          
          // Process all m3u8 paths
          playlist = playlist.replace(/^(?!#)([^\s]+)(\.m3u8)(\?[^\s]*)?$/gm, (match) => {
              // Convert to absolute URL
              const fullUrl = match.startsWith('http')
                  ? match
                  : match.startsWith('/')
                    ? `${baseUrl.origin}${match}`
                    : `${baseUrl.origin}${basePath}${match}`;
                    
              return `/api/hls-proxy?url=${encodeURIComponent(fullUrl)}&referer=${encodeURIComponent(effectiveReferer)}`;
          });
          
          // Process encryption keys
          playlist = playlist.replace(/#EXT-X-KEY:([^,]*,)?URI="([^"]+)"/g, (match, attributes = '', keyUri) => {
              // Convert relative key URI to absolute
              const fullKeyUrl = keyUri.startsWith('http')
                  ? keyUri
                  : keyUri.startsWith('/')
                    ? `${baseUrl.origin}${keyUri}`
                    : `${baseUrl.origin}${basePath}${keyUri}`;
                    
              return `#EXT-X-KEY:${attributes}URI="/api/proxy?url=${encodeURIComponent(fullKeyUrl)}&referer=${encodeURIComponent(effectiveReferer)}"`;
          });
          
          if (debug === '1') {
              console.log('PROCESSED PLAYLIST:', playlist);
          }
          
          // We've already set the Content-Type header at the beginning
          res.setHeader('Cache-Control', 'no-cache, no-store');
          return res.send(playlist);
      } else {
          // For binary segments
          // We've already set the Content-Type header at the beginning
          res.status(response.status);
          res.setHeader('Content-Length', response.data.byteLength);
          
          // Handle range requests
          if (req.headers.range && response.headers['content-range']) {
              res.status(206);
              res.setHeader('Accept-Ranges', 'bytes');
              res.setHeader('Content-Range', response.headers['content-range']);
          }
          
          return res.send(Buffer.from(response.data));
      }
  } catch (error) {
      console.error('HLS proxy error:', error.message);
      console.error(`Full error: ${JSON.stringify({
          message: error.message,
          code: error.code,
          status: error.response?.status,
          url: req.query.url
      }, null, 2)}`);
      
      res.status(500).send(`HLS proxy error: ${error.message}`);
  }
});

// Handle OPTIONS requests for CORS preflight
app.options('/api/proxy', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(204).end();
});

app.options('/api/hls-proxy', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(204).end();
});
// Start the server
app.listen(PORT, () => {
  console.log(`Anime API server running on port ${PORT}`);
  console.log(`Supported providers: animepahe, zoro`);
});