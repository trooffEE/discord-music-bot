"use strict"
require("dotenv").config()

const ytdl = require("ytdl-core") // Library for downloading video on YouTube
let { getData } = require("spotify-url-info") // Method for getting very basic data from Spotify song
const youtubeSearch = require("youtube-search") // Library for searching video on YouTube using song title
const Discord = require("discord.js")
const bot = new Discord.Client()
const { MessageAttachment } = require("discord.js")
const TOKEN = process.env.TOKEN_BOT //
const TOKEN_YT = process.env.TOKEN_YT // Secure
const musicChannelID = process.env.MUSIC_CHANNEL //       data
const musicLog = process.env.MUSIC_LOG //
const chat = process.env.CHAT //

let server // var for specific user info depending on id
let spotifyURL = "https://open.spotify.com/track/"
let servers = {}
let songsList = []
let repeat = false
let isSkipping = false

bot.on("message", async (message) => {
  let args = message.content.split(" ")
  const voiceChannel = message.member.voice.channel || { id: 0 }

  switch (args[0]) {
    case "!play":
      message.delete()
      let link = args[1]
      let repeat = args[2] === 'repeat'

      // Note: Старт функции для проигрывния музыки
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
          const { videoDetails } = await ytdl.getInfo(link)
          song.title = videoDetails.title
          song.lengthSeconds = videoDetails.lengthSeconds
          song.customer = message.member.nickname
  
          sendMusicLogMessage(`:musical_note: ${song.title}\nЗаказал: ${song.customer}\nПесен в очереди: ${songsInQueue}`)
        }

        server.dispatcher = connection.play(
          ytdl(link, {
            filter: "audioonly",
            highWaterMark: 1 << 25, // adding this line fixes ending video
            // before dispatcher "finish" event
          }),
          {volume: 0.2}
        )

        server.dispatcher.on("finish", () => {
          if (!repeat) {
            server.queue.shift()
          } else {
            if (isSkipping) {
              repeat = false
              server.queue.shift()
            }
          }
          if (link) play(connection, message)
          else connection.disconnect()
        })
      }
      // ====================================================== play

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

      // if provided link relates to Spotify
      if (link.startsWith(spotifyURL)) {
        let spotifyData = await getData(
          "https://open.spotify.com/track/5nTtCOCds6I0PHMNtqelas"
        )
        let author = spotifyData.artists[0].name
        let song = spotifyData.name

        // for YouTube search
        let opts = {
          maxResults: 1,
          key: TOKEN_YT,
        }

        let ytLink
        youtubeSearch(`${author} ${song}`, opts, (err, results) => {
          if (err) {
            console.log(err)
            return
          }

          ytLink = results[0].link
          server.queue.push(ytLink)

          if (!message.guild.voiceConnection)
            voiceChannel.join().then((connection) => play(connection, message))
        })
        // if link is YouTube video 
      } else {
        server.queue.unshift(link)

        if (!message.guild.voiceConnection)
          voiceChannel.join().then((connection) => play(connection, message))
      }
      break

    case "!pause":
      message.delete()
      server = servers[message.guild.id]
      if (server.dispatcher) server.dispatcher.pause()
      break

    case "!resume":
      message.delete()
      server = servers[message.guild.id]
      if (server.dispatcher) server.dispatcher.resume()
      break

    case "!skip":
      message.delete()
      server = servers[message.guild.id]
      if (server.dispatcher) {
        server.dispatcher.end()
        isSkipping = true
      }
      break

    // FIX ME ↓
    case "!stop":
      message.delete()
      server = servers[message.guild.id]

      if (message.guild.voice.connection) {
        server.queue = []

        server.dispatcher.end()
        console.log("\nStopped the queue!")
      }

      if (message.guild.connection) message.guild.voiceConnection.disconnect()
      break
    // FIX ME ↑

    case "vlad":
    case "pasha":
      message.delete()
      const attachment = new MessageAttachment(`./images/${args[0]}.jpg`)
      sendMainChatMessage(message, "Я крутой", attachment)
      break
  }
})

bot.on("ready", () => {
  console.log("Bot Started!")
})

bot.login(TOKEN)

function sendMusicLogMessage(message) {
  bot.channels.cache
    .get(`${musicLog}`)
    .send(message)
}

// Да да почему изначально не писал на нормальном языке.... вот тебе и 
// messageDiscordObject
function sendMainChatMessage(messageDiscordObject, message, attachment) {
  if (!attachment) {
    return messageDiscordObject.channel.send(message)
  } else {
    return messageDiscordObject.channel.send(message, attachment)
  }
}

function sendSelfDestroyMessage(messageDiscordObject, message, attachment) {
  sendMainChatMessage(messageDiscordObject, message, attachment)
    .then((msg) => msg.delete({ timeout: '3000' }))
}


// Сделать админские команды