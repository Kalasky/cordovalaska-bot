const { setupTwitchClient } = require('./tmiSetup')
const twitchClient = setupTwitchClient()
const { spotifyHandler } = require('../middleware/spotifyRefreshHandler')
const User = require('../models/User')

const queue = async (uri, username) => {
  await spotifyHandler()
  const user = await User.findOne({ spotifyUsername: process.env.SPOTIFY_USERNAME })
  try {
    let res = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${uri}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.spotifyAccessToken}`,
        'Content-Type': 'application/json',
      },
    })
    console.log(`Spotify queue response: ${res.status}`)

    // if user is in the blacklist, return
    if (user.blacklist.includes(username)) {
      twitchClient.say(process.env.TWITCH_USERNAME, `Sorry ${username}, is blacklisted from adding songs to the queue.`)
      return
    }


      if (uri) {

      
    // get only the track id from the link
    const trackIdOnly = uri.substring(uri.lastIndexOf(':') + 1)

    // check length of song and return if it is longer than 10 minutes
    const getTrackLength = await fetch(`https://api.spotify.com/v1/tracks/${trackIdOnly}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${user.spotifyAccessToken}`,
      },
    })

    const trackLength = await getTrackLength.json()

    console.log(`Track length: ${trackLength.duration_ms}`)

    if (trackLength.duration_ms > user.songDurationLimit) {
      twitchClient.say(
        process.env.TWITCH_USERNAME,
        `Sorry, that song is too long. The max duration is ${(user.songDurationLimit / 60000).toFixed(1)} minutes.`
      )
      return
    }

    if (res.status === 204) {
      twitchClient.say(process.env.TWITCH_USERNAME, `Added ${username}'s song to the queue!`)
    }
    if (res.status === 404) {
      twitchClient.say(
        process.env.TWITCH_USERNAME,
        'No active device found. The streamer must be playing music to add a song to the queue.'
      )
    }
  }
  } catch (err) {
    console.log(err)
  }
}

const searchSong = async (query) => {
  await spotifyHandler()
  const user = await User.findOne({ spotifyUsername: process.env.SPOTIFY_USERNAME })
  try {
    let res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${user.spotifyAccessToken}`,
        'Content-Type': 'application/json',
      },
    })
    console.log(`Spotify search response: ${res.status}`)
    const data = await res.json()

    if (!data.tracks.items[0]) {
      twitchClient.say(process.env.TWITCH_USERNAME, 'No song found from Spotify. Please try again.')
      return
    }

    const trackId = data.tracks.items[0].uri
    return trackId
  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  queue,
  searchSong,
}
