const {
  MUSIC_LOG,
} = require('../constants/discord')

function notifyError(error) {
  console.log('================================================')
  console.log(error)
  console.log('================================================')
}

function sendMusicLogMessage(message) {
  bot.channels.cache
    .get(`${MUSIC_LOG}`)
    .send(message)
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

module.exports.notifyError = notifyError
module.exports.sendMusicLogMessage = sendMusicLogMessage
module.exports.sendMainChatMessage = sendMainChatMessage
module.exports.sendSelfDestroyMessage = sendSelfDestroyMessage