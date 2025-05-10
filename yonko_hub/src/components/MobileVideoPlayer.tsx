'use client'

import { useEffect, useRef, useState } from 'react';

interface MobileVideoPlayerProps {
  src: string;
  poster?: string;
}

export default function MobileVideoPlayer({ src, poster }: MobileVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bufferTimerRef = useRef<number | null>(null);
  const seekRecoveryTimerRef = useRef<number | null>(null);
  const lastSeekTimeRef = useRef<number>(0);
  const seekRecoveryAttemptsRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [bufferInfo, setBufferInfo] = useState<{current: number, end: number}>({current: 0, end: 0});
  const maxRetries = 3;
  const [fallbackMode, setFallbackMode] = useState(false);
  const [quality, setQuality] = useState<'auto' | 'high' | 'medium' | 'low'>('auto');
  const [isInSeekRecovery, setIsInSeekRecovery] = useState(false);
  const lastPlayStateRef = useRef<boolean>(false); // Track play state before seeking

  // Use direct mp4 fallback for mobile when HLS fails
  const getFallbackUrl = (originalUrl: string) => {
    // Extract the original stream URL
    const urlParams = new URLSearchParams(originalUrl.split('?')[1]);
    const originalStreamUrl = urlParams.get('url');
    const referer = urlParams.get('referer');
    
    if (!originalStreamUrl) return '';
    
    // For kwik sources, try to get an mp4 fallback
    if (originalStreamUrl.includes('kwik') || originalStreamUrl.includes('kwikie.ru')) {
      // Extract domain and path parts
      const decodedUrl = decodeURIComponent(originalStreamUrl);
      const urlParts = decodedUrl.split('/');
      
      // Try to create an mp4 URL from the HLS URL
      if (urlParts.length >= 8) {
        // For kwik urls, the pattern is usually: https://vault-xx.kwikie.ru/stream/{id}/xx/{hash}/uwu.m3u8
        // We can try: https://vault-xx.kwikie.ru/stream/{id}/xx/{hash}/uwu.mp4
        const mp4Url = decodedUrl.replace('.m3u8', '.mp4');
        
        return `https://yonkohubproxyserver-production-70eb.up.railway.app/api/proxy?url=${encodeURIComponent(mp4Url)}&referer=${referer || ''}&timestamp=${Date.now()}&direct=1`;
      }
    }
    
    // If no fallback could be created
    return '';
  };

  // Setup buffering monitoring
  const setupBufferMonitoring = (video: HTMLVideoElement) => {
    // Clear any existing timer
    if (bufferTimerRef.current) {
      clearInterval(bufferTimerRef.current);
    }
    
    // Setup new monitoring
    bufferTimerRef.current = window.setInterval(() => {
      if (!video) return;
      
      const currentTime = video.currentTime;
      
      // Find the appropriate buffer range that contains current time
      let bufferedEnd = 0;
      for (let i = 0; i < video.buffered.length; i++) {
        if (currentTime >= video.buffered.start(i) && 
            currentTime <= video.buffered.end(i)) {
          bufferedEnd = video.buffered.end(i);
          break;
        }
      }
      
      // Calculate buffer length
      const bufferLength = bufferedEnd - currentTime;
      
      // Update buffer info state
      setBufferInfo({
        current: currentTime,
        end: bufferedEnd
      });
      
      // If buffer is too low, force preload
      if (bufferLength < 30 && !video.paused) {
        // Force preload
        forcePreload(video);
      }
      
    }, 1000); // Check every second
  };
  
  // Force preload of video content
  const forcePreload = (video: HTMLVideoElement) => {
    // Set preload attribute explicitly
    video.preload = 'auto';
    
    try {
      // Try to use Media Source API to load more content
      if ('mediaSource' in window || 'WebKitMediaSource' in window) {
        // This is just a hint to the browser to load more content
        // The browser will decide how much to actually buffer
        const currentPlaybackRate = video.playbackRate;
        
        // Temporarily pause to allow buffer to build (if critically low buffer)
        const bufferLength = bufferInfo.end - bufferInfo.current;
        if (bufferLength < 10 && !video.paused && video.readyState < 4) {
          // Brief pause to build buffer
          video.pause();
          setTimeout(() => {
            video.play()
          }, 1500);
        }
        
        // Nudge the video playback rate momentarily as a hint
        video.playbackRate = 0;
        setTimeout(() => {
          video.playbackRate = currentPlaybackRate;
        }, 100);
      }
    } catch (e) {
      console.log('Force preload error:', e);
    }
  };

  // Apply optimal mobile settings
  const applyOptimalSettings = (video: HTMLVideoElement) => {
    // Mobile optimal settings
    video.preload = 'auto';
    
    // For better seek performance
    try {
      // @ts-ignore - Non-standard property
      if ('fastSeek' in video) video.fastSeek = true;
    } catch (e) {
      console.log('fastSeek not supported');
    }
    
    // Optimize for mobile
    try {
      // Set buffer size hints through media element
      // @ts-ignore - These are custom properties
      if ('bufferingRate' in video) video.bufferingRate = 3.0; // Buffer 3x faster
      // @ts-ignore
      if ('bufferingGoal' in video) video.bufferingGoal = 120; // 120 seconds buffer goal
    } catch (e) {
      console.log('Custom buffering properties not supported');
    }
    
    // Set playback rate temporarily to 0 to encourage buffering
    const originalRate = video.playbackRate;
    video.playbackRate = 0;
    setTimeout(() => {
      video.playbackRate = originalRate;
    }, 1000);
  };
  
  // Add specific seeking-stuck recovery logic
  const handleSeek = () => {
    const video = videoRef.current;
    if (!video) return;
    
    // Store if we were playing before seeking
    lastPlayStateRef.current = !video.paused;
    
    // Record the time when seeking occurred
    lastSeekTimeRef.current = Date.now();
    seekRecoveryAttemptsRef.current = 0;
    setIsInSeekRecovery(false);
    
    // Start the monitoring system to detect stuck seeks
    monitorSeekRecovery(video);
    
    // For iOS/Safari - temporarily set playback rate to 0 during seeking
    // This can help with buffer management
    const originalRate = video.playbackRate;
    video.playbackRate = 0;
    setTimeout(() => {
      if (video && !video.seeking) {
        video.playbackRate = originalRate;
      }
    }, 300);
  };
  
  // Seek recovery system 
  const monitorSeekRecovery = (video: HTMLVideoElement) => {
    // Clear any previous recovery attempt
    if (seekRecoveryTimerRef.current) {
      clearTimeout(seekRecoveryTimerRef.current);
    }
    
    // Check if seeking is stuck after a reasonable time
    seekRecoveryTimerRef.current = window.setTimeout(() => {
      // If video is still seeking or hasn't progressed since seeking
      const timeElapsed = Date.now() - lastSeekTimeRef.current;
      const isStuck = (
        video.seeking || // Still in seeking state
        (video.readyState < 3 && lastPlayStateRef.current) || // Not enough data but should be playing
        (lastPlayStateRef.current && video.paused && timeElapsed > 2000) // Should be playing but is paused
      );
      
      if (isStuck) {
        seekRecoveryAttemptsRef.current++;
        
        setIsInSeekRecovery(true);
        
        // Progressive recovery attempts
        if (seekRecoveryAttemptsRef.current === 1) {
          // First attempt: Force preload and try to kickstart playback
          forcePreload(video);
          
          if (lastPlayStateRef.current && video.paused) {
            try {
              // Try resuming playback
              video.play();
            } catch (e) {
              console.log('Play error in recovery:', e);
            }
          }
          
          // Schedule next check
          monitorSeekRecovery(video);
        } 
        else if (seekRecoveryAttemptsRef.current === 2) {
          // Second attempt: Try micro-seeking to unstick the player
          const currentTime = video.currentTime;
          const microSeekDelta = 0.25; // Small time shift
          
          // Try to seek backward slightly as it often helps more than forward seeking
          try {
            video.currentTime = Math.max(0, currentTime - microSeekDelta);
            
            // After micro-seek backwards, try to play
            setTimeout(() => {
              if (lastPlayStateRef.current && video.paused) {
                try {
                  video.play();
                } catch (e) {
                  console.log('Play error after micro-seek:', e);
                }
              }
            }, 100);
          } catch (e) {
            console.error('Micro-seek error:', e);
          }
          
          // Schedule next check
          monitorSeekRecovery(video);
        }
        else if (seekRecoveryAttemptsRef.current === 3) {
          // Third attempt: Force internal media pipeline reset
          try {
            // Force a re-parsing of the media by temporarily disabling the src
            const currentTime = video.currentTime;
            const wasPlaying = lastPlayStateRef.current;
            
            // Use this technique which forces the media engine to reset
            video.pause();
            
            // Store the current source
            const currentSrc = video.src;
            
            // Empty the source briefly
            video.removeAttribute('src');
            // Force DOM update and media resource unloading
            video.load();
            
            // Put back the source
            setTimeout(() => {
              video.src = currentSrc;
              video.load();
              
              // On metadata loaded, restore position and play if needed
              video.onloadedmetadata = () => {
                video.currentTime = currentTime;
                
                if (wasPlaying) {
                  video.play();
                }
              };
            }, 50); // Very brief pause
          } catch (e) {
            console.error('Media reset error:', e);
          }
          
          // Schedule next check (longer timeout to allow reset to work)
          setTimeout(() => monitorSeekRecovery(video), 1000);
        }
        else if (seekRecoveryAttemptsRef.current >= 4) {
          // Last resort: Complete source refresh with cache-busting
          const currentTime = video.currentTime;
          const wasPlaying = lastPlayStateRef.current;
          
          // Create a source URL with new timestamp to bust cache
          let refreshedSrc = video.src;
          refreshedSrc = refreshedSrc.includes('?') 
            ? refreshedSrc.replace(/timestamp=\d+/, `timestamp=${Date.now()}`) 
            : `${refreshedSrc}${refreshedSrc.includes('?') ? '&' : '?'}timestamp=${Date.now()}`;
          
          // Also add seek hint to the URL so proxy server can optimize for this position
          refreshedSrc += `&seekTo=${Math.floor(currentTime)}`;
          
          // Reset the source and restore position
          video.pause();
          video.src = refreshedSrc;
          video.load();
          
          // After loading, restore time position and play state
          video.onloadedmetadata = () => {
            video.currentTime = currentTime;
            
            // Resume if it was playing
            if (wasPlaying) {
              setTimeout(() => {
                video.play().catch(e => {
                  console.log('Resume after source refresh failed:', e);
                });
              }, 200);
            }
            
            // Reset seek recovery
            seekRecoveryAttemptsRef.current = 0;
            setIsInSeekRecovery(false);
          };
        }
      } else {
        // If not stuck, reset seek recovery state
        seekRecoveryAttemptsRef.current = 0;
        setIsInSeekRecovery(false);
      }
    }, 1500); // First check after 1.5 seconds
  };

  useEffect(() => {
    setLoading(true);
    setErrorMessage(null);
    const video = videoRef.current;
    if (!video) return;

    // Create a clean source URL with proper parameters
    let sourceUrl = src;
    if (!sourceUrl.includes('timestamp=')) {
      sourceUrl += (sourceUrl.includes('?') ? '&' : '?') + `timestamp=${Date.now()}`;
    }
    
    // Add direct and simplified mode for initial load
    if (!sourceUrl.includes('direct=')) sourceUrl += '&direct=1';
    if (!sourceUrl.includes('simplified=')) sourceUrl += '&simplified=1';
    
    // Add buffer optimization hint for proxy server
    if (!sourceUrl.includes('buffer=')) sourceUrl += '&buffer=120';
    
    // Add quality parameter if not auto
    if (quality !== 'auto') {
      sourceUrl += `&quality=${quality}`;
    }
    
    // Add mobile optimization hint
    sourceUrl += '&mobile=1&optimize=1';

    // Try fallback mode if we've had multiple retries
    if (retryCount >= 2 || fallbackMode) {
      const fallbackUrl = getFallbackUrl(sourceUrl);
      if (fallbackUrl) {
        sourceUrl = fallbackUrl;
        setFallbackMode(true);
      }
    }

    // Set source and apply optimizations
    video.src = sourceUrl;
    applyOptimalSettings(video);
    
    // Configure video element for mobile
    video.playsInline = true;
    video.autoplay = false;
    video.muted = true;
    video.preload = 'auto';
    
    // Initialize buffer monitoring
    setupBufferMonitoring(video);
    
    // Force initial loading
    video.load();

    // Event handlers
    const handleError = () => {
      const errorCode = video.error?.code || 0;
      const errorMessage = video.error?.message || 'Unknown error';
      console.error(`Mobile video error (${errorCode}): ${errorMessage}`);
      
      if (retryCount < maxRetries) {
        // Prepare for retry
        setRetryCount(prevCount => prevCount + 1);
        
        // Generate a completely unique source with timestamp and retry counter
        setTimeout(() => {
          if (video) {
            // Try a lower quality on retry for better chance of success
            const qualityParam = retryCount === 1 ? 'medium' : 'low';
            
            const newSrc = src + (src.includes('?') ? '&' : '?') + 
                          `timestamp=${Date.now()}&retry=${retryCount + 1}&direct=1&simplified=1&quality=${qualityParam}&buffer=120&mobile=1`;
            
            video.src = newSrc;
            video.load();
            try {
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise.catch(e => console.log('Auto-play after retry failed (expected):', e));
              }
            } catch (e) {
              console.error('Play error:', e);
            }
          }
        }, 2000);
      } else {
        // If we reached max retries
        setLoading(false);
        
        // Try fallback mode if not already in it
        if (!fallbackMode) {
          const fallbackUrl = getFallbackUrl(src);
          if (fallbackUrl) {
            setFallbackMode(true);
            setRetryCount(0); // Reset retry count for the new source type
            video.src = fallbackUrl;
            video.load();
            try {
              video.play().catch(e => console.log('Fallback play failed (expected):', e));
            } catch (e) {
              console.error('Fallback play error:', e);
            }
            return;
          }
        }
        
        setErrorMessage(`Cannot play this video (Error ${errorCode}). Please try another quality.`);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      lastPlayStateRef.current = true;
      setLoading(false);
      video.muted = false; // Unmute once playing
    };

    const handlePause = () => {
      if (!video.seeking) { // Only update if not during a seek operation
        setIsPlaying(false);
        lastPlayStateRef.current = false;
      }
    };

    const handleLoadStart = () => {
      // Keep native loading UI only
    };
    
    const handleCanPlay = () => {
      setLoading(false);
      // Attempt to unmute and play once it's ready
      video.muted = false;
      
      // Don't auto-play on mobile as it causes issues
      // Let the user initiate playback through controls
    };
    
    // Waiting handler to detect buffering issues
    const handleWaiting = () => {
      // Force buffer refresh
      forcePreload(video);
    };
    
    // Progress handler to monitor buffer increase
    const handleProgress = () => {
      // Check if we're building enough buffer
      let maxBufferEnd = 0;
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.end(i) > maxBufferEnd) {
          maxBufferEnd = video.buffered.end(i);
        }
      }
      
      // Update buffer info
      setBufferInfo({
        current: video.currentTime,
        end: maxBufferEnd
      });
      
      // If we were in seek recovery but now have enough buffer, try to resume playback
      if (isInSeekRecovery && lastPlayStateRef.current && video.paused) {
        const bufferAhead = maxBufferEnd - video.currentTime;
        if (bufferAhead > 2) { // At least 2 seconds of buffer
          try {
            video.play().catch(e => console.log('Auto resume after buffer build failed:', e));
          } catch (e) {
            console.error('Play error after buffer build:', e);
          }
        }
      }
    };

    // Handle seeking events for stuck seek detection
    const handleSeeking = () => {
      handleSeek();
    };
    
    // Handle when seeking completes
    const handleSeeked = () => {
      // Update seek time to mark completion
      lastSeekTimeRef.current = Date.now();
      
      // Check if we have buffer at the new position
      let isInBufferedRange = false;
      const currentTime = video.currentTime;
      
      for (let i = 0; i < video.buffered.length; i++) {
        if (currentTime >= video.buffered.start(i) && 
            currentTime <= video.buffered.end(i)) {
          isInBufferedRange = true;
          break;
        }
      }
      
      if (!isInBufferedRange && video.readyState < 3) {
        // If not in buffer range, start seek recovery monitoring
        monitorSeekRecovery(video);
      } else {
        setIsInSeekRecovery(false);
        
        // Try to resume playing if we were playing before
        if (lastPlayStateRef.current && video.paused) {
          try {
            video.play().catch(e => console.log('Resume after seek failed:', e));
          } catch (e) {
            console.error('Play error after seek:', e);
          }
        }
      }
    };
    
    // Register event listeners
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);
    
    // When video is first loaded, force it to buffer ahead
    setTimeout(() => {
      forcePreload(video);
    }, 2000);

    return () => {
      // Clean up event listeners
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
      
      // Clear buffer monitoring
      if (bufferTimerRef.current) {
        clearInterval(bufferTimerRef.current);
        bufferTimerRef.current = null;
      }
      
      // Clear seek recovery timer
      if (seekRecoveryTimerRef.current) {
        clearTimeout(seekRecoveryTimerRef.current);
        seekRecoveryTimerRef.current = null;
      }
      
      // Clean up video element
      video.pause();
      video.src = '';
      video.load();
    };
  }, [src, retryCount, fallbackMode, quality]);

  return (
    <div className="w-full relative">
      {/* Show errors if max retries reached */}
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 p-4">
          <p className="text-white text-center mb-4">{errorMessage}</p>
          <div className="flex flex-col space-y-3">
            <button 
              onClick={() => {
                setRetryCount(0);
                setErrorMessage(null);
                setFallbackMode(!fallbackMode); // Toggle fallback mode
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
            >
              {fallbackMode ? "Try HLS Stream" : "Try MP4 Version"}
            </button>
            
            <div className="flex space-x-2 justify-center">
              <button 
                onClick={() => {
                  setQuality('low');
                  setRetryCount(0);
                  setErrorMessage(null);
                }}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-md text-sm"
              >
                Low Quality
              </button>
              <button 
                onClick={() => {
                  setQuality('medium');
                  setRetryCount(0);
                  setErrorMessage(null);
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded-md text-sm"
              >
                Medium Quality
              </button>
              <button 
                onClick={() => {
                  setQuality('high');
                  setRetryCount(0);
                  setErrorMessage(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md text-sm"
              >
                High Quality
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Video element */}
      <video 
        ref={videoRef} 
        className="w-full aspect-video bg-black" 
        controls 
        playsInline 
        poster={poster}
      />
      
      {/* Play button overlay - only show when needed */}
      {!isPlaying && !loading && !errorMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-5">
          <button 
            onClick={() => {
              const video = videoRef.current;
              if (video) {
                // Unmute when user interacts
                video.muted = false;
                
                try {
                  const playPromise = video.play();
                  if (playPromise !== undefined) {
                    playPromise.catch(e => {
                      console.error('Play button click error:', e);
                    });
                  }
                } catch (e) {
                  console.error('Play button click error:', e);
                }
              }
            }}
            className="bg-indigo-600/80 hover:bg-indigo-700 text-white p-6 rounded-full"
          >
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
              <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}