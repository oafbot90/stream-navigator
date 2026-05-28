
// SuperFlixAPI service
export const superflixApi = {
  // Get movie player URL
  getMoviePlayerUrl: (imdbId: string, customParams: string = "") => {
    // Check if we need to add the noLink parameter
    if (customParams.includes('#transparent') && !customParams.includes('#noLink')) {
      customParams += '#noLink';
    } else if (!customParams) {
      customParams = '#noLink';
    }
    
    return `https://superflixapi.help/filme/${imdbId}${customParams}`;
  },
  
  // Get TV show player URL
  getTVPlayerUrl: (imdbId: string, season: number, episode: number, customParams: string = "") => {
    // Check if we need to add the noLink parameter
    if (customParams.includes('#transparent') && !customParams.includes('#noLink')) {
      customParams += '#noLink';
    } else if (!customParams) {
      customParams = '#noLink';
    }
    
    return `https://superflixapi.help/serie/${imdbId}/${season}/${episode}${customParams}`;
  },
  
  // Get Streamtape player URL
  getStreamtapePlayerUrl: (
    streamtapeId: string, 
    options: {
      subtitleUrl?: string,
      language?: string,
      logoUrl?: string,
      logoLink?: string,
      vastUrl?: string,
      noLink?: boolean
    } = {}
  ) => {
    const {
      subtitleUrl = "",
      language = "pt-BR",
      logoUrl = "",
      logoLink = "",
      vastUrl = "",
      noLink = true // Default to true to hide the link button
    } = options;
    
    let url = `https://superflixapi.link/stape/${streamtapeId}`;
    
    const params = new URLSearchParams();
    if (subtitleUrl) params.append("sub", subtitleUrl);
    if (language) params.append("lang", language);
    if (logoUrl) params.append("logo", logoUrl);
    if (logoLink) params.append("logo_link", logoLink);
    if (vastUrl) params.append("vast", vastUrl);
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    // Add the noLink parameter
    if (noLink) {
      url += url.includes('?') ? '#noLink' : '#noLink';
    }
    
    return url;
  }
};
