require('dotenv').config()

const mongoose = require('mongoose')
const User = require('./models/User')

const { setupTwitchClient } = require('./utils/tmiSetup')
const twitchClient = setupTwitchClient()

const express = require('express')
const app = express()
const cors = require('cors')
const PORT = process.env.PORT || 3000

// middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// routes
const spotifyRoutes = require('./routes/spotifyRoutes')
app.use('/api', spotifyRoutes)
app.get('/', (req, res) => {
  res.send('Access token and refresh token have been updated. You can close this window.')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

// connect to db
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('DATABASE CONNECTED'))
  .catch((err) => console.log('DATABASE CONNECTION ERROR: ', err))

const {
  queueCommand,
  songDurationCommand,
  blacklistCommand,
  unblacklistCommand,
  currentSongCommand,
} = require('./utils/commands')

queueCommand()
songDurationCommand()
blacklistCommand()
unblacklistCommand()
currentSongCommand()
