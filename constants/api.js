require('dotenv').config()

const BASE_SPOTIFY_URL = process.env.BASE_SPOTIFY_URL
const TOKEN_YT = process.env.TOKEN_YT
const CORONA_URL = process.env.CORONA_URL
const YOUTUBE_SEARCH_OPTIONS = {
  maxResults: 1,
  key: TOKEN_YT,
}

module.exports.BASE_SPOTIFY_URL = BASE_SPOTIFY_URL
module.exports.TOKEN_YT = TOKEN_YT
module.exports.YOUTUBE_SEARCH_OPTIONS = YOUTUBE_SEARCH_OPTIONS
module.exports.CORONA_URL = CORONA_URL