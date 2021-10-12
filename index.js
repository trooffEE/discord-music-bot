'use strict'
require('dotenv').config()

const ytdl = require('ytdl-core') // Library for downloading video on YouTube
const { getData } = require('spotify-url-info') // Method for getting very basic data from Spotify song
const youtubeSearch = require('youtube-search') // Library for searching video on YouTube using song title
const axios = require('axios');
const Discord = require('discord.js')
const bot = new Discord.Client()
const { MessageAttachment } = require('discord.js')
const TOKEN = process.env.TOKEN_BOT //
const TOKEN_YT = process.env.TOKEN_YT // Secure
const musicChannelID = process.env.MUSIC_CHANNEL //       data
const musicLog = process.env.MUSIC_LOG //
const spotifyURL = process.env.BASE_SPOTIFY_URL
const youTubeOptions = {
  maxResults: 1,
  key: TOKEN_YT,
}
const VLAD_ID = process.env.VLAD_ID
const SECRET_WORD = process.env.SECRET_WORD

let server
let servers = {}
let repeat = false, isSkipping = false

// Section: Бот - инициализация
bot.on('ready', () => {
  console.log('Бот инициализировался!')
})

bot.login(TOKEN)

// Section: Helper-функции
function notifyError(error) {
  console.log('================================================')
  console.log(error)
  console.log('================================================')
}

function sendMusicLogMessage(message) {
  bot.channels.cache
    .get(`${musicLog}`)
    .send(message)
}

function sendMainChatMessage(messageDiscordObject, message, attachment) {// Note: Переписать на TypeScript
  if (!attachment) {
    return messageDiscordObject.channel.send(message)
  } else {
    return messageDiscordObject.channel.send(message, attachment)
  }
}

function sendSelfDestroyMessage(messageDiscordObject, message, attachment, delay = '3000') {
  sendMainChatMessage(messageDiscordObject, message, attachment)
    .then((msg) => msg.delete({ timeout: delay }))
}

async function play(connection, message) {
  let link = server.queue[0]

  if (!link) {
    return
  }

  if (!ytdl.validateURL(link) && !link.startsWith(spotifyURL)) {
    sendSelfDestroyMessage(
      message, 
      'Ссылка некорректная. Я принимаю только ссылки - YouTube и Spotify (в разработке :screwdriver: )'
    )
    return
  }
    
  let song = {}
  let songsInQueue = server.queue.length

  if (!repeat) {
    try {
      const { videoDetails } = await ytdl.getInfo(link)
      song.title = videoDetails.title
      song.lengthSeconds = videoDetails.lengthSeconds
      song.customer = message.member.nickname
  
      sendMusicLogMessage(`:musical_note: ${song.title}\nЗаказал: ${song.customer}\nПесен в очереди: ${songsInQueue}`)

    } catch(error) {

      notifyError(error)
      sendMusicLogMessage(`:see_no_evil: Ошибка связанная с получением информации по ссылке: ` + `*link*`)
      
    }
  }

  server.dispatcher = connection.play(
    ytdl(link, {
      filter: 'audioonly', // adding line 'highWaterMark: 1 << 25' fixes ending video
      highWaterMark: 1 << 25, // before dispatcher 'finish' event
    }),
    { volume: 0.2 }
  )

  server.dispatcher.on('finish', () => {
    if (!repeat) {
      server.queue.shift()
    } else {
      if (isSkipping) {
        repeat = false
        server.queue.shift()
      }
    }
    if (link) {
      play(connection, message)
    }
    else { 
      connection.disconnect()
    }
  })
}

function transformNumber(numbers) {
  return numbers.forEach((num, idx) => {
    if (idx % 3 === 0) {
      numbers.splice(index, 0, ' ')
    }
  })
}

function checkName(message) {
  return message.toLowerCase().contains(`${SECRET_WORD}-семпай`) ||
      message.toLowerCase().contains(`${SECRET_WORD} семпай`) ||
      message.toLowerCase().contains('семпай')
}

// Section: Слушатель сообщений
bot.on('message', async (message) => {
  const voiceChannel = message.member.voice.channel || { id: 0 }
  const args = message.content.split(' ')

  if (checkName(message)) {
    console.log(message.author.nickname + ` написал ${SECRET_WORD}-семпай`)
  }

  if (+message.author.id === +VLAD_ID) {
    if (checkName(message)) {
        message.member.kick()
          .then(() => {
            console.log('Влад был кикнут.')
          })
          .catch(notifyError)
      }
  }

  switch (args[0].toLowerCase()) {

    case '!corona':
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
      break

    case '!corona-ru':
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

          sendSelfDestroyMessage(message, 
            textAboutRussia + textAboutRegions,
            null,
            60_000
          )
        })
        .catch(notifyError)
      break

    case '!play':
      message.delete()
      let link = args[1]
      let repeat = args[2] === 'repeat'

      if (!link) {
        sendSelfDestroyMessage(message, 'Необходимо указать ссылку вторым аргументом после "!play"')
        return
      }

      if (!voiceChannel) {
        sendSelfDestroyMessage(message, 'Необходимо находиться в канале "music allowed"')
        return
      }

      if (voiceChannel.id !== musicChannelID) {
        sendSelfDestroyMessage(message, 'Необходимо находиться в канале "music allowed"')
        return
      }

      if (!servers[message.guild.id]) {
        servers[message.guild.id] = {
          queue: [],
        }
      }

      server = servers[message.guild.id]

      // CASE: Spotify link
      if (link.startsWith(spotifyURL)) {
        try {
          let spotifyData = await getData('https://open.spotify.com/track/5nTtCOCds6I0PHMNtqelas')
        } catch(error) {
          notifyError(err)
          return
        }
        const song = {
          author: spotifyData.artists[0].name,
          title: spotifyData.name,
        }

        youtubeSearch(`${song.author} ${song.title}`, youTubeOptions, (err, youtubeVideoList) => {
          if (err) {
            notifyError(err)
            return
          }

          server.queue.push(youtubeVideoList[0].link)

          if (!message.guild.voiceConnection) {
            voiceChannel.join().then((connection) => play(connection, message))
          }
        })
      // CASE: YouTube link 
      } else {
        server.queue.push(link)

        if (!message.guild.voiceConnection) {
          voiceChannel.join().then((connection) => play(connection, message))
        }
      }
      break

    case '!pause':
      message.delete()
      server = servers[message.guild.id]
      if (server.dispatcher) server.dispatcher.pause()
      break

    case '!resume':
      message.delete()
      server = servers[message.guild.id]
      if (server.dispatcher) server.dispatcher.resume()
      break

    case '!skip':
      message.delete()
      server = servers[message.guild.id]
      if (server.dispatcher) {
        server.dispatcher.end()
        isSkipping = true
      }
      break

    case '!stop':
      message.delete()
      server = servers[message.guild.id]

      if (message.guild.voice.connection) {
        server.queue = []

        server.dispatcher.end()
        console.log('\nОчистил очередь!')
      }

      if (message.guild.connection) message.guild.voiceConnection.disconnect()
      break

    case 'vlad':
    case 'pasha':
      message.delete()
      const attachment = new MessageAttachment(`./images/${args[0]}.jpg`)
      sendMainChatMessage(message, 'Я крутой', attachment)
      break
  }
})