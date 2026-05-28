
// Embedder API service - with ad blocking support
export const embedderApi = {
  // Base URL
  baseUrl: "https://embedder.net/e",
  
  // Get movie player URL by TMDB ID
  getMoviePlayerUrl: (tmdbId: string) => {
    console.log(`Creating Embedder movie URL with TMDB ID: ${tmdbId}`);
    // Using the direct TMDB ID method
    return `${embedderApi.baseUrl}/movie?tmdb=${tmdbId}`;
  },
  
  // Get movie player URL by title and year
  getMoviePlayerUrlByTitle: (title: string, year: string) => {
    return `${embedderApi.baseUrl}/movie?title=${encodeURIComponent(title)}&year=${year}`;
  },
  
  // Get TV show player URL by TMDB ID
  getTVPlayerUrl: (tmdbId: string, season: number, episode: number) => {
    console.log(`Creating Embedder TV URL with TMDB ID: ${tmdbId}, Season: ${season}, Episode: ${episode}`);
    // Using the direct TMDB ID method
    return `${embedderApi.baseUrl}/series?tmdb=${tmdbId}&sea=${season}&epi=${episode}`;
  },
  
  // Get TV show player URL by title and year
  getTVPlayerUrlByTitle: (title: string, year: string, season: number, episode: number) => {
    return `${embedderApi.baseUrl}/series?title=${encodeURIComponent(title)}&year=${year}&sea=${season}&epi=${episode}`;
  },
  
  // Get direct content player URL by ID
  getDirectPlayerUrl: (contentId: string, season?: number, episode?: number) => {
    if (season && episode) {
      return `${embedderApi.baseUrl}/${contentId}/${season}/${episode}`;
    }
    return `${embedderApi.baseUrl}/${contentId}`;
  }
};

// Add a CSS injection script to block ads
export const adBlockScript = `
  (function() {
    // Block all potential ad iframes and popups
    function blockAds() {
      // Remove all iframes that look like ads
      const iframes = document.querySelectorAll('iframe:not([src*="embedder.net/e"])');
      iframes.forEach(iframe => iframe.remove());
      
      // Block overlay ads
      const overlays = document.querySelectorAll('div[id*="ads"], div[class*="ads"], div[style*="z-index: 9999"]');
      overlays.forEach(overlay => overlay.remove());
      
      // Override window.open to prevent popups
      window.open = function() { return null; };
    }
    
    // Run immediately and set intervals
    blockAds();
    setInterval(blockAds, 100);
    
    // Block ad-related scripts
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeName === 'SCRIPT') {
              const src = node.src || '';
              if (src.includes('ads') || src.includes('analytics') || src.includes('tracker')) {
                node.remove();
              }
            }
          });
        }
      });
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  })();
`;
