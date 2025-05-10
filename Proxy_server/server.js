// anime-api.js - Express server for anime streaming API
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { createClient } = require('redis');
const app = express();
const PORT = 5000;

// Base URL for Consumet API
const CONSUMET_API = 'http://localhost:4000';

// Redis client setup with your credentials
const redisClient = createClient({
  username: 'default',
  password: 'your_redis_password',
  socket: {
    host: 'redis-15262.c267.us-east-1-4.ec2.redns.redis-cloud.com',
    port: 15262
  }
});

// Redis cache configuration - store only anime info and episode lists
const CACHE_TTL = {
  INFO: 86400,     // 24 hours for anime details
  EPISODES: 43200, // 12 hours for episode lists
  SEARCH: 7200     // 2 hours for search results (smaller data)
};

let redisReady = false;

// Connect to Redis and handle events
(async () => {
  try {
    await redisClient.connect();
    redisReady = true;
    console.log('Connected to Redis successfully');
    
    // Monitor memory usage and log warning if approaching limit
    setInterval(async () => {
      try {
        const info = await redisClient.info('memory');
        const usedMemory = parseInt(info.match(/used_memory:(\d+)/)[1]);
        const usedMemoryMB = (usedMemory / 1024 / 1024).toFixed(2);
        
        if (usedMemoryMB > 25) { // 25MB warning threshold (out of 30MB)
          console.warn(`Redis memory usage at ${usedMemoryMB}MB - approaching limit of 30MB`);
        }
        
        console.log(`Redis memory usage: ${usedMemoryMB}MB`);
      } catch (err) {
        console.error('Error checking Redis memory:', err);
      }
    }, 3600000); // Check hourly
    
    // Start the server only after Redis connection
    app.listen(PORT, () => {
      console.log(`Anime API server running on port ${PORT}`);
      console.log(`Supported providers: animepahe, zoro`);
      console.log(`Redis caching enabled`);
    });
    
  } catch (err) {
    console.error('Redis connection error:', err);
    console.log('API will operate without caching');
    // Start the server without caching:
    app.listen(PORT, () => {
      console.log(`Anime API server running on port ${PORT}`);
      console.log(`Supported providers: animepahe, zoro`);
      console.log(`Redis caching disabled`);
    });
  }
})();

// Handle Redis errors without crashing the server
redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
  redisReady = false;
});

// Cache helper functions
async function getCache(key) {
  if (!redisReady) return null;
  
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Redis get error for key ${key}:`, err.message);
    return null;
  }
}

async function setCache(key, data, ttl) {
  if (!redisReady || !data) return;
  
  try {
    // For large objects, add error handling
    const stringData = JSON.stringify(data);
    
    // Skip caching very large objects to avoid memory issues
    if (stringData.length > 1024 * 1024) { // 1MB limit per item
      console.log(`Skipping cache for key ${key} - data too large (${Math.round(stringData.length/1024)}KB)`);
      return;
    }
    
    await redisClient.set(key, stringData, { EX: ttl });
    console.log(`Cached data for ${key} (${Math.round(stringData.length/1024)}KB) with TTL ${ttl}s`);
  } catch (err) {
    console.error(`Redis set error for key ${key}:`, err.message);
  }
}

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// 1. Search anime endpoint with caching
app.get('/api/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const cacheKey = `search:${query}`;
    
    // Try to get from cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for search: ${query}`);
      return res.json(cachedData);
    }
    
    console.log(`Cache miss for search: ${query}`);
    const response = await axios.get(`${CONSUMET_API}/meta/anilist/${encodeURIComponent(query)}`);
    const results = response.data.results || [];
    
    // Cache search results but with shorter TTL
    await setCache(cacheKey, results, CACHE_TTL.SEARCH);
    
    res.json(results);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Failed to search anime' });
  }
});

// 2. Get anime info endpoint with caching
app.get('/api/info/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const provider = req.query.provider || 'animepahe';
    const cacheKey = `info:${id}:${provider}`;
    
    // Try to get from cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for anime info: ${id} (provider: ${provider})`);
      return res.json(cachedData);
    }
    
    console.log(`Cache miss for anime info: ${id} (provider: ${provider})`);
    console.log(`Getting info for ID ${id} with provider: ${provider}`);
    
    const response = await axios.get(`${CONSUMET_API}/meta/anilist/info/${id}?provider=${provider}`);
    
    // Cache anime info
    await setCache(cacheKey, response.data, CACHE_TTL.INFO);
    
    res.json(response.data);
  } catch (error) {
    console.error('Info error:', error.message);
    res.status(500).json({ error: 'Failed to fetch anime info' });
  }
});

// 3. Get episodes endpoint with caching
app.get('/api/episodes/:id', async (req, res) => {
  const provider = req.query.provider || 'animepahe';
  try {
    const { id } = req.params;
    const cacheKey = `episodes:${id}:${provider}`;
    
    // Try to get from cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for episodes: ${id} (provider: ${provider})`);
      return res.json(cachedData);
    }
    
    console.log(`Cache miss for episodes: ${id} (provider: ${provider})`);
    console.log(`Fetching episodes for ID ${id} with provider: ${provider}`);
    
    const response = await axios.get(
      `${CONSUMET_API}/meta/anilist/episodes/${id}?provider=${provider}`
    );
    
    // Cache episode data
    await setCache(cacheKey, response.data || [], CACHE_TTL.EPISODES);
    
    res.json(response.data || []);
  } catch (error) {
    console.error('Episodes error:', error.message);
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
});

// 4. Get streaming sources endpoint - NOT cached to save memory
app.get('/api/watch/:animeId/:episodeId', async (req, res) => {
  try {
    const { animeId, episodeId } = req.params;
    const provider = req.query.provider || 'animepahe';
    console.log(`Fetching streaming sources with provider: ${provider}`);

    if (provider === 'animepahe') {
      // AnimePahe specific handling
      const Id = animeId + '/' + episodeId;
      console.log('Combined ID for AnimePahe:', Id);
      
      // Try first method (meta API)
      try {
        const metaResponse = await axios.get(
          `${CONSUMET_API}/anime/animepahe/watch?episodeId=${Id}`
        );
        
        if (metaResponse.data && metaResponse.data.sources && metaResponse.data.sources.length) {
          // Sort sources to put higher quality first
          if (Array.isArray(metaResponse.data.sources)) {
            metaResponse.data.sources.sort((a, b) => {
              // Try to extract quality number (like 720 or 1080)
              const getQualityNumber = (q) => {
                const match = q?.match(/(\d+)p/);
                return match ? parseInt(match[1]) : 0;
              };
              return getQualityNumber(b.quality) - getQualityNumber(a.quality);
            });
          }
          return res.json(metaResponse.data);
        }
      } catch (err) {
        console.log('Meta API streaming failed, trying direct API');
      }
      
      // Try second method (direct API)
      const directResponse = await axios.get(
        `${CONSUMET_API}/anime/animepahe/watch?episodeId=${episodeId}`
      );
      
      // Sort sources to put higher quality first
      if (directResponse.data && Array.isArray(directResponse.data.sources)) {
        directResponse.data.sources.sort((a, b) => {
          // Try to extract quality number
          const getQualityNumber = (q) => {
            const match = q?.match(/(\d+)p/);
            return match ? parseInt(match[1]) : 0;
          };
          return getQualityNumber(b.quality) - getQualityNumber(a.quality);
        });
      }
      
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

// 5. Zoro search with caching
app.get('/api/zoro/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const cacheKey = `zoro:search:${query}`;
    
    // Try to get from cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for Zoro search: ${query}`);
      return res.json(cachedData);
    }
    
    console.log(`Cache miss for Zoro search: ${query}`);
    console.log(`Direct Zoro search for: ${query}`);
    
    const response = await axios.get(`${CONSUMET_API}/anime/zoro/${encodeURIComponent(query)}`);
    const results = response.data.results || [];
    
    // Cache search results
    await setCache(cacheKey, results, CACHE_TTL.SEARCH);
    
    res.json(results);
  } catch (error) {
    console.error('Zoro search error:', error.message);
    res.status(500).json({ error: 'Failed to search anime on Zoro' });
  }
});

// Zoro episode streaming - NOT cached to save memory
app.get('/api/zoro/:episodeId', async (req, res) => {
  const { episodeId } = req.params;
  console.log(`Fetching Zoro streaming for episode ID: ${episodeId}`);
  try {
    // For Zoro, we use the episodeId directly
    const zoroResponse = await axios.get(
      `${CONSUMET_API}/anime/zoro/watch?episodeId=${episodeId}`
    );
    
    if (zoroResponse.data) {
      // Sort sources to put higher quality first
      if (zoroResponse.data.sources && Array.isArray(zoroResponse.data.sources)) {
        zoroResponse.data.sources.sort((a, b) => {
          // Try to extract quality number
          const getQualityNumber = (q) => {
            const match = q?.match(/(\d+)p/);
            return match ? parseInt(match[1]) : 0;
          };
          return getQualityNumber(b.quality) - getQualityNumber(a.quality);
        });
      }
      
      return res.json(zoroResponse.data);
    } else {
      return res.status(404).json({ error: 'No sources found on Zoro' });
    }
  } catch (error) {
    console.error('Zoro streaming error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch streaming from Zoro' });
  }
});

// Add cache management endpoint for administrators
app.get('/api/cache/info', async (req, res) => {
  if (!redisReady) {
    return res.status(500).json({ error: 'Redis not connected' });
  }
  
  try {
    // Get memory usage
    const info = await redisClient.info('memory');
    const usedMemory = parseInt(info.match(/used_memory:(\d+)/)[1]);
    const usedMemoryMB = (usedMemory / 1024 / 1024).toFixed(2);
    
    // Count keys by type
    const infoKeys = await redisClient.keys('info:*');
    const episodeKeys = await redisClient.keys('episodes:*');
    const searchKeys = await redisClient.keys('search:*');
    const zoroSearchKeys = await redisClient.keys('zoro:search:*');
    
    res.json({
      status: 'connected',
      usedMemory: `${usedMemoryMB}MB`,
      keyCounts: {
        infoKeys: infoKeys.length,
        episodeKeys: episodeKeys.length,
        searchKeys: searchKeys.length,
        zoroSearchKeys: zoroSearchKeys.length,
        total: infoKeys.length + episodeKeys.length + searchKeys.length + zoroSearchKeys.length
      }
    });
  } catch (error) {
    console.error('Cache info error:', error);
    res.status(500).json({ error: 'Failed to get cache info' });
  }
});

// Cache clearing endpoint (for administration)
app.post('/api/cache/clear/:type', async (req, res) => {
  if (!redisReady) {
    return res.status(500).json({ error: 'Redis not connected' });
  }
  
  try {
    const { type } = req.params;
    let pattern;
    
    switch (type) {
      case 'info':
        pattern = 'info:*';
        break;
      case 'episodes':
        pattern = 'episodes:*';
        break;
      case 'search':
        pattern = 'search:*';
        break;
      case 'zoro':
        pattern = 'zoro:*';
        break;
      case 'all':
        pattern = '*';
        break;
      default:
        return res.status(400).json({ error: 'Invalid cache type' });
    }
    
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    
    res.json({
      success: true,
      message: `Cleared ${keys.length} keys with pattern "${pattern}"`
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Dashboard endpoint for administrators
app.get('/api/dashboard', async (req, res) => {
  if (!redisReady) {
    return res.status(500).json({ error: "Redis not connected" });
  }
  
  try {
    const infoStr = await redisClient.info('memory');
    const usedMemory = parseInt(infoStr.match(/used_memory:(\d+)/)[1]);
    const usedMemoryMB = (usedMemory / 1024 / 1024).toFixed(2);
    
    const infoKeys = await redisClient.keys('info:*');
    const episodeKeys = await redisClient.keys('episodes:*');
    const searchKeys = await redisClient.keys('search:*');
    const zoroSearchKeys = await redisClient.keys('zoro:search:*');
    
    res.json({
      redis: {
        connected: true,
        memoryUsageMB: usedMemoryMB,
        keyCounts: {
          info: infoKeys.length,
          episodes: episodeKeys.length,
          search: searchKeys.length,
          zoro: zoroSearchKeys.length,
          total: infoKeys.length + episodeKeys.length + searchKeys.length + zoroSearchKeys.length
        }
      },
      server: {
        port: PORT,
        providers: ['animepahe', 'zoro']
      }
    });
  } catch (err) {
    console.error("Dashboard endpoint error:", err);
    res.status(500).json({ error: "Dashboard error: " + err.message });
  }
});

// Keep all your existing proxy endpoints unchanged
// Improved proxy endpoint with better binary data handling
app.get('/api/proxy', async (req, res) => {
  // Your existing proxy implementation...
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

      // Rest of your proxy code...
      // Binary data handling
      if (useArrayBuffer) {
          // Determine content type
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
              contentType = 'video/mp4';
          } else {
              contentType = response.headers['content-type'] || 'application/octet-stream';
          }

          res.status(response.status);
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Length', response.data.byteLength);
          
          if (req.headers.range && response.headers['content-range']) {
              res.status(206);
              res.setHeader('Accept-Ranges', 'bytes');
              res.setHeader('Content-Range', response.headers['content-range']);
          }

          return res.send(Buffer.from(response.data));
      }
      
      // Handle non-binary files
      Object.entries(response.headers).forEach(([key, value]) => {
          if (!key.toLowerCase().startsWith('access-control') && 
              !['content-encoding', 'transfer-encoding', 'connection', 
                'content-security-policy'].includes(key.toLowerCase())) {
              res.setHeader(key, value);
          }
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      
      if (req.headers.range && response.headers['content-range']) {
          res.status(206);
          res.setHeader('Accept-Ranges', 'bytes');
      } else {
          res.status(response.status);
      }

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

// Keep your HLS proxy endpoint unchanged
app.get('/api/hls-proxy', async (req, res) => {
  // Your existing HLS proxy implementation...
  try {
      const { url, referer, debug } = req.query;
      if (!url) {
          return res.status(400).send('Missing URL parameter');
      }

      const isM3U8 = url.toString().toLowerCase().endsWith('.m3u8');
      const requestUrl = decodeURIComponent(url.toString());
      
      // Rest of your HLS proxy implementation...
      console.log(`[M3U8 Proxy] Processing ${isM3U8 ? 'M3U8' : 'segment'}: ${requestUrl.substring(0, 100)}...`);
      
      // Always set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');
      
      // Content type
      res.setHeader('Content-Type', isM3U8 ? 'application/vnd.apple.mpegurl' : 'video/mp4');
      
      // Special domain handling for referers
      const parsedUrl = new URL(requestUrl);
      let effectiveReferer = referer;
      
      if (!effectiveReferer) {
          if (parsedUrl.hostname.includes('padorupado.ru')) {
              effectiveReferer = 'https://kwik.si/';
          } else if (parsedUrl.hostname.includes('kwik')) {
              effectiveReferer = 'https://kwik.si/';
          } else {
              effectiveReferer = `https://${parsedUrl.hostname}/`;
          }
      }
      
      // Retry logic
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

      // Continue with your existing HLS proxy logic...
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
          
          // Ensure valid M3U8
          if (!playlist.includes('#EXTM3U')) {
              console.error('Invalid M3U8 file received (no #EXTM3U header)');
              console.error('Response content:', playlist.substring(0, 300));
              return res.status(500).send('Invalid M3U8 file received (no #EXTM3U header)');
          }
          
          // Process segment files
          playlist = playlist.replace(/^(?!#)([^\s]+)(\.ts|\.jpg|\.jpeg|\.png|\.mp4|\.m4s|\.key)(\?[^\s]*)?$/gm, (match) => {
              const fullUrl = match.startsWith('http')
                  ? match
                  : match.startsWith('/')
                    ? `${baseUrl.origin}${match}`
                    : `${baseUrl.origin}${basePath}${match}`;
                    
              return `/api/proxy?url=${encodeURIComponent(fullUrl)}&referer=${encodeURIComponent(effectiveReferer)}`;
          });
          
          // Process m3u8 paths
          playlist = playlist.replace(/^(?!#)([^\s]+)(\.m3u8)(\?[^\s]*)?$/gm, (match) => {
              const fullUrl = match.startsWith('http')
                  ? match
                  : match.startsWith('/')
                    ? `${baseUrl.origin}${match}`
                    : `${baseUrl.origin}${basePath}${match}`;
                    
              return `/api/hls-proxy?url=${encodeURIComponent(fullUrl)}&referer=${encodeURIComponent(effectiveReferer)}`;
          });
          
          // Process encryption keys
          playlist = playlist.replace(/#EXT-X-KEY:([^,]*,)?URI="([^"]+)"/g, (match, attributes = '', keyUri) => {
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
          
          res.setHeader('Cache-Control', 'no-cache, no-store');
          return res.send(playlist);
      } else {
          // For binary segments
          res.status(response.status);
          res.setHeader('Content-Length', response.data.byteLength);
          
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

// Keep your CORS options handlers
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