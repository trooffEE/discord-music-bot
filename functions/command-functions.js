const axios = require('axios')
const { OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, GENIUS_SECRET } = require('../constants/api');
const { TOKEN_YT } = require('../constants')
const { google } = require('googleapis')

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const { 
  sendSelfDestroyMessage,
  notifyError,
} = require("./helper-functions");

const showAlbanianCoronavirus = async (message) => {
  message.delete()
  // Note: https://covid-19-data.unstatshub.org/datasets/cases-country/api
  axios.get("https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases2_v1/FeatureServer/2/query?where=Country_Region%20%3D%20'ALBANIA'&outFields=Country_Region,Confirmed,Deaths&outSR=4326&f=json")
    .then(({ data }) => {
      const albania = data.features[0]

      const deaths = albania.attributes.Deaths
      const infected = albania.attributes.Confirmed
      const text = `:flag_al: Албанский коронавирус :flag_al:\nЗаражено: ${infected}\nПомэрло: ${deaths}`

      sendSelfDestroyMessage(message, text, null, 60_000)
    })
    .catch(notifyError)
}

const showRussianCoronavirus = async (message) => {
  message.delete()
  // Note: https://apify.com/krakorj/covid-russia
  axios.get('https://api.apify.com/v2/key-value-stores/1brJ0NLbQaJKPTWMO/records/LATEST')
    .then(({ data }) => {
      const kemerovo = data.infectedByRegion.find(region => region.isoCode === 'RU-KEM')
      const spb = data.infectedByRegion.find(region => region.isoCode === 'RU-SPE')
      const krasnoyarsk = data.infectedByRegion.find(region => region.isoCode === 'RU-KYA')
      const yakutsk = data.infectedByRegion.find(region => region.isoCode === 'RU-SA')
      const regions = [kemerovo, spb, krasnoyarsk, yakutsk]

      const textAboutRegions = regions.map(region => {
        return `\n**${region.region}**:` + 
        `\nЗаражено: ${region.infected} человек` + 
        `\nВыздоровело: ${region.recovered} человек` + 
        `\nПогибло: ${region.deceased} человек`
      }).join('\n')

      const textAboutRussia = `:flag_ru: **Русский коронавирус** :flag_ru:` +
        `\nОбщая статистика по России:\n` + 
        `\nЗаражено: ${data.infected} человек` + 
        `\nПрошли тест: ${data.tested} человек` + 
        `\nВыздоровело: ${data.recovered} человек` + 
        `\nПогибло: ${data.deceased} человек\n`

      sendSelfDestroyMessage(
        message, 
        `${textAboutRussia}${textAboutRegions}`,
        null,
        60_000
      )
    })
    .catch(notifyError)
}

const getPlaylistData = async (playlistId) => {
  const youtube = google.youtube({
    version: 'v3',
    auth: TOKEN_YT
  })
  
  try {
    const { data } = await youtube.playlistItems.list({
      part: 'contentDetails',
      playlistId,
      maxResults: 50,
    })
    const baseLink = 'https://www.youtube.com/watch?v='
    return data.items.map(playlistItem => baseLink + playlistItem.contentDetails.videoId )
  } catch(e) {
    notifyError(e)
  }
}

const geniusGetApi = (endpoint, additionalParams) => {
  additionalParams = encodeURIComponent(additionalParams);
  
  const getPath = 'https://api.genius.com' + endpoint + additionalParams
  
  return axios.get(getPath, {
    headers: {
      'Authorization': `Bearer ${GENIUS_SECRET}`
    }
  })
}

/**
 * 
 * @param { string } title 
 */
const _searchForGeniusSongEntries = async (query) => {
  const response = await geniusGetApi('/search?q=', query)
  return response.data.response.hits.filter(
    (entry) => {
      return entry.type === 'song'
    }
  )
}

const getRawLyrics = async (songURI) => {
  let html = (await axios.get('https://genius.com' + songURI)).data

  const dom = new JSDOM(html), dataAttributeToSearch = '[data-lyrics-container="true"]'
  const rootOfLyrics = dom.window.document.querySelector(dataAttributeToSearch)
  if (!rootOfLyrics) {
    return null
  }

  return rootOfLyrics.innerHTML.replaceAll('<br>', '\n').replace(/<[^>]*>?/gm, '');
}

const searchForSong = async (query) => {
  const songs = await _searchForGeniusSongEntries(query)

  // We Assume that first one - is the one that most relevant
  const ourSong = songs[0]
  if (!ourSong) {
    return null
  }
  const title = ourSong.result.full_title
  const thumbnailUrl = ourSong.result.song_art_image_thumbnail_url
  const releaseDate = ourSong.result.release_date_for_display
  const language = ourSong.result.language

  const lyricsPageURI = ourSong.result.path
  const lyricsParsed = await getRawLyrics(lyricsPageURI)
  const lyrics = lyricsParsed ? lyricsParsed : ourSong.result.url
  
  return {
    title,
    thumbnailUrl,
    releaseDate,
    language,
    lyrics
  }
}

module.exports.getPlaylistData = getPlaylistData
module.exports.showRussianCoronavirus = showRussianCoronavirus
module.exports.showAlbanianCoronavirus = showAlbanianCoronavirus
module.exports.searchForSong = searchForSong