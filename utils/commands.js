const twitchClientSetup = require('./tmiSetup')
const twitchClient = twitchClientSetup.setupTwitchClient()
const { queue } = require('./spotifyUtils')
const User = require('../models/User')

// utils
const updateSongDurationLimit = async (newDuration) => {
  try {
    const user = await User.findOneAndUpdate(
      { twitchUsername: process.env.TWITCH_USERNAME },
      { $set: { songDurationLimit: newDuration } },
      { new: true }
    )
    return user
  } catch (error) {
    console.log(error)
  }
}

const removeFromBlacklist = async (username) => {
  const user = await User.findOne({ twitchUsername: process.env.TWITCH_USERNAME })
  // find the index of the username in the blacklist array
  const index = user.blacklist.indexOf(username)
  if (index > -1) {
    user.blacklist.splice(index, 1)
    console.log(`Removed ${username} from the blacklist`)
    await user.save()
  }
}

const addToBlacklist = async (username) => {
  const user = await User.findOne({ twitchUsername: process.env.TWITCH_USERNAME })
  // if user is already in the blacklist, return
  if (user.blacklist.includes(username)) {
    twitchClient.say(process.env.TWITCH_USERNAME, `User is already blacklisted.`)
    return
  } else {
    user.blacklist.push(username)
    console.log(`Added ${username} to the blacklist`)
  }
  await user.save()
}

// commands
const queueCommand = async () => {
  twitchClient.on('message', async (channel, tags, message, self) => {
    if (self) return

    const args = message.slice(1).split(' ')
    const command = args.shift().toLowerCase()

    if (command === 'queue' || (command === 'q' && !args[0])) {
      twitchClient.say(process.env.TWITCH_USERNAME, `Please provide a track link!`)
    }
    if (command === 'queue' || (command === 'q' && args[0])) {
      const trackLink = args[0]
      let newLink = trackLink.replace('https://open.spotify.com/track/', 'spotify:track:')
      let trackId = newLink.substring(0, newLink.indexOf('?'))

      if (!trackId.includes('spotify:track:')) {
        twitchClient.say(process.env.TWITCH_USERNAME, 'Sorry, that is not a track link.')
        return
      }

      queue(trackId, tags.username)
    }
  })
}

// commands
const blacklistCommand = () => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    const args = message.slice(1).split(' ')
    const command = args.shift().toLowerCase()

    if (command === 'blacklist' && tags.username === process.env.TWITCH_USERNAME) {
      addToBlacklist(args[0])
      twitchClient.say(process.env.TWITCH_USERNAME, `Added ${args[0]} to the blacklist.`)
    }
  })
}

const unblacklistCommand = () => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    const args = message.slice(1).split(' ')
    const command = args.shift().toLowerCase()

    if (command === 'unblacklist' && tags.username === process.env.TWITCH_USERNAME) {
      removeFromBlacklist(args[0])
      twitchClient.say(process.env.TWITCH_USERNAME, `Removed ${args[0]} from the blacklist.`)
    }
  })
}

let maxDuration = 600000

const songDurationCommand = () => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    const command = message.slice(1).split(' ')[0].toLowerCase()
    const newDuration = parseInt(message.slice(1).split(' ')[1])
    if (command === 'songduration' || (command === 'sd' && tags.username === process.env.TWITCH_USERNAME)) {
      if (!isNaN(newDuration) && newDuration > 0) {
        maxDuration = newDuration * 1000 // convert to milliseconds
        updateSongDurationLimit(maxDuration)
        twitchClient.say(process.env.TWITCH_USERNAME, `Song duration has been set to ${newDuration} seconds.`)
      } else {
        twitchClient.say(process.env.TWITCH_USERNAME, `Please enter a valid number of seconds.`)
      }
    }
  })
}

module.exports = {
  queueCommand,
  blacklistCommand,
  unblacklistCommand,
  songDurationCommand,
}
