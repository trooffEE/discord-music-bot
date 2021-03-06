const axios = require('axios')
const { OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } = require('../constants/api');
const { TOKEN_YT } = require('../constants')
const { google } = require('googleapis')

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

module.exports.getPlaylistData = getPlaylistData
module.exports.showAlbanianCoronavirus = showAlbanianCoronavirus
module.exports.showRussianCoronavirus = showRussianCoronavirus