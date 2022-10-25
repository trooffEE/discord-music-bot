const {
  MUSIC_LOG,
  SECRET_WORD,
} = require('../constants')
const { GENIUS_TEXT_CHANNEL } = require('../constants/api')

function notifyError(error) {
  console.log('================================================')
  console.log(error)
  console.log('================================================')
}

function sendMusicLogMessage(bot, message) {
  bot.channels.cache
    .get(`${MUSIC_LOG}`)
    .send(message)
}

function sendMusicLyricsMessage(bot, message, attachment = null) {
  bot.channels.cache
    .get(`${GENIUS_TEXT_CHANNEL}`)
    .send(message, attachment)
}

function sendMainChatMessage(messageDiscordObject, message, attachment) {
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

function checkSecretWord(_) {
  const message = _.content
  return message.toLowerCase().includes(`${SECRET_WORD}-семпай`) ||
      message.toLowerCase().includes(`${SECRET_WORD} семпай`) ||
      message.toLowerCase().includes('семпай') ||
      message.toLowerCase().includes(`${SECRET_WORD}-сэмпай`) ||
      message.toLowerCase().includes(`${SECRET_WORD} сэмпай`) ||
      message.toLowerCase().includes('сэмпай')
}

module.exports.notifyError = notifyError
module.exports.sendMusicLogMessage = sendMusicLogMessage
module.exports.sendMainChatMessage = sendMainChatMessage
module.exports.sendSelfDestroyMessage = sendSelfDestroyMessage
module.exports.checkSecretWord = checkSecretWord
module.exports.sendMusicLyricsMessage = sendMusicLyricsMessage