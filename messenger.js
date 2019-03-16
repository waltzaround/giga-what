const apiKey = process.env.DIRECTIONS_API_KEY;
const rp = require('request-promise');
const Sequelize = require('sequelize');
const moment = require('moment-timezone')
const _ = require('lodash')

const sequelize = new Sequelize({ dialect: 'sqlite', storage: './database.sqlite' });

const UserSettings = sequelize.define('userSettings', {
	senderId: {
		type: Sequelize.STRING,
	},
	homeLat: {
		type: Sequelize.DOUBLE,
	},
	homeLong: {
		type: Sequelize.DOUBLE,
	},
	workLat: {
		type: Sequelize.DOUBLE,
	},
	workLong: {
		type: Sequelize.DOUBLE,
	},
	officeArrivalTime: {
		type: Sequelize.STRING,
	},
	isMondayEnabled: {
		type: Sequelize.BOOLEAN,
	},
	isTuesdayEnabled: {
		type: Sequelize.BOOLEAN,
	},
	isWednesdayEnabled: {
		type: Sequelize.BOOLEAN,
	},
	isThursdayEnabled: {
		type: Sequelize.BOOLEAN,
	},
	isFridayEnabled: {
		type: Sequelize.BOOLEAN,
	},
	isSaturdayEnabled: {
		type: Sequelize.BOOLEAN,
	},
	isSundayEnabled: {
		type: Sequelize.BOOLEAN,
	},
	currentLocationIntent: {
		type: Sequelize.STRING,
	}
});

sequelize.sync()

async function sendMessage(recipient, messageText) {
	await rp({
	  method: 'POST',
	  uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
	  body: {
	  	"messaging_type": "RESPONSE",
	  	"recipient": recipient,
	  	"message": {
	  	  "text": messageText,
	  	},
	  },
	  json: true,
	})
}

async function sendCurrentLocationPrompt(recipient, messageText) {
	await rp({
	  method: 'POST',
	  uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
	  body: {
	  	"messaging_type": "RESPONSE",
	  	"recipient": recipient,
	  	"message": {
	  	  "text": messageText,
	  	  "quick_replies":[
	  	    {
	  	      "content_type": "location",
	  	    },
	  	  ]
	  	},
	  },
	  json: true,
	})
}

async function sendWhenPrompt(recipient, messageText) {
	await rp({
	  method: 'POST',
	  uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
	  body: {
	  	"messaging_type": "RESPONSE",
	  	"recipient": recipient,
	  	"message": {
	  	  "attachment": {
	  	    "type": "template",
	  	    "payload": {
	  	      "template_type": "button",
	  	      "text":  messageText,
	  	      "buttons": [
	  	        {
	  	          "type": "web_url",
	  	          "url": `${process.env.MESSENGER_FRONTEND_URL}/?senderId=${recipient.id}`,
	  	          "title": "Select",
	  	          "webview_height_ratio": "Compact",
	  	          // "messenger_extensions": true,
	  	          "webview_share_button": "hide",
	  	        }
	  	      ]
	  	    }
	  	  }
	  	},
	  },
	  json: true,
	})
}

async function sendLinkMessage(recipient, messageText, url, buttonText) {
	await rp({
	  method: 'POST',
	  uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
	  body: {
	  	"messaging_type": "RESPONSE",
	  	"recipient": recipient,
	  	"message": {
	  	  "attachment": {
	  	    "type": "template",
	  	    "payload": {
	  	      "template_type": "button",
	  	      "text":  messageText,
	  	      "buttons": [
	  	        {
	  	          "type": "web_url",
	  	          url,
	  	          "title": buttonText,
	  	          "webview_height_ratio": "full",
	  	          "webview_share_button": "hide",
	  	        }
	  	      ]
	  	    }
	  	  }
	  	},
	  },
	  json: true,
	})
}
async function sendLinkMessageStreetView(recipient, messageText, url, buttonText) {
	if (recipient.id == '2132496623507619' || recipient.id == '1895793460527211') {
		await sendLinkMessage(recipient, 'Get to know your bus stop!', `https://api.zappy.chat/ar`, 'Augmented Reality')
	}
	else {
		await sendLinkMessage(recipient, `This is your bus stop.`, url, 'Street View')
	}

}
async function sendDisruptionMessage(recipient, messageText, busUrl) {
	await rp({
	  method: 'POST',
	  uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
	  body: {
	  	"messaging_type": "RESPONSE",
	  	"recipient": recipient,
	  	"message": {
	  	  "attachment": {
	  	    "type": "template",
	  	    "payload": {
	  	      "template_type": "button",
	  	      "text":  messageText,
	  	      "buttons": [
	  	        {
	  	          "type": "web_url",
	  	          url: "https://m.uber.com/ul/",
	  	          "title": "Get Uber",
	  	          "webview_height_ratio": "full",
	  	          "webview_share_button": "hide",
	  	        },
	  	        {
	  	          "type": "web_url",
	  	          url: "https://www.li.me/",
	  	          "title": "Find a Lime",
	  	          "webview_height_ratio": "full",
	  	          "webview_share_button": "hide",
	  	        },
	  	        {
	  	          "type": "web_url",
	  	          url: busUrl,
	  	          "title": "See next bus",
	  	          "webview_height_ratio": "full",
	  	          "webview_share_button": "hide",
	  	        }
	  	      ]
	  	    }
	  	  }
	  	},
	  },
	  json: true,
	})

}

function getDayofWekkWithTimeMoment(dayOfWeek, time) {
	const today = moment().isoWeekday();
	if (today <= dayOfWeek) { 
	  return moment(time, "h:mm").isoWeekday(dayOfWeek);
	}
	else {
	  return moment(time, "h:mm").add(1, 'weeks').isoWeekday(dayOfWeek);
	}
}

function getNextArrivalTimeMoment(userSettings) {
	if (userSettings.isMondayEnabled) {
		return getDayofWekkWithTimeMoment(1, userSettings.officeArrivalTime)
	}
	else if (userSettings.isTuesdayEnabled) {
		return getDayofWekkWithTimeMoment(2, userSettings.officeArrivalTime)
	}
	else if (userSettings.isWednesdayEnabled) {
		return getDayofWekkWithTimeMoment(3, userSettings.officeArrivalTime)
	}
	else if (userSettings.isThursdayEnabled) {
		return getDayofWekkWithTimeMoment(4, userSettings.officeArrivalTime)
	}
	else if (userSettings.isFridayEnabled) {
		return getDayofWekkWithTimeMoment(5, userSettings.officeArrivalTime)
	}
	else if (userSettings.isSaturdayEnabled) {
		return getDayofWekkWithTimeMoment(6, userSettings.officeArrivalTime)
	}
	else if (userSettings.isSundayEnabled) {
		return getDayofWekkWithTimeMoment(7, userSettings.officeArrivalTime)
	}
}
async function getBusRouteData(originCoords, destCoords, arrivalTime) {
	const arrivalTimeUnix = arrivalTime.unix()
  const data = await rp({
  	uri: 'https://maps.googleapis.com/maps/api/directions/json',
  	qs: {
  		'origin': `${originCoords.lat},${originCoords.long}`,
  		'destination': `${destCoords.lat},${destCoords.long}`,
  		'mode': `transit`,
  		'arrival_time': `${arrivalTimeUnix}`,
  		'key': `${apiKey}`,
  	},
  	json: true,
  })
  return data
}
async function getBusRouteDataByDepTime(originCoords, destCoords, departureTime) {
	const departureTimeUnix = departureTime.unix()
  const data = await rp({
  	uri: 'https://maps.googleapis.com/maps/api/directions/json',
  	qs: {
  		'origin': `${originCoords.lat},${originCoords.long}`,
  		'destination': `${destCoords.lat},${destCoords.long}`,
  		'mode': `transit`,
  		'departure_time': `${departureTimeUnix}`,
  		'key': `${apiKey}`,
  	},
  	json: true,
  })
  return data
}

function getBusStopLocation(data) {
  if (data.routes.length > 0) {
	  const travelModeTransitStep = _.find(data.routes[0].legs[0].steps, { travel_mode: 'TRANSIT' }) 
	  console.log('travelModeTransitStep',travelModeTransitStep)
	  const location = travelModeTransitStep.start_location
	  return location
  }
  else {
  	return undefined
  }
}

function getBusStopTime(data) {
  if (data.routes.length > 0) {
	  const travelModeTransitStep = _.find(data.routes[0].legs[0].steps, { travel_mode: 'TRANSIT' }) 
	  // console.log('travelModeTransitStep',travelModeTransitStep)
	  const departureTime = travelModeTransitStep.transit_details.departure_time
	  if (departureTime) {
	  	const departureTimeMoment = moment.unix(departureTime.value)
	  	return departureTimeMoment
	  }
	  else {
	  	return undefined
	  }
  }
  else {
  	return undefined
  }
}
function getBusNumber(data) {
  if (data.routes.length > 0) {
	  const travelModeTransitStep = _.find(data.routes[0].legs[0].steps, { travel_mode: 'TRANSIT' }) 
	  const line = travelModeTransitStep.transit_details.line
	  if (line) {
	  	return line.short_name
	  }
	  else {
	  	return undefined
	  }
  }
  else {
  	return undefined
  }

}

function getCommuteDepartureTime(data) {
  if (data.routes.length > 0) {
  	const departureTime = data.routes[0].legs[0].departure_time
  	if (departureTime) {
  		const departureTimeMoment = moment.unix(departureTime.value)
  		return departureTimeMoment  	
  	}
  	else {
  		return undefined
  	}  	
  }
  else {
  	return undefined
  }
}

function getStreetViewLink(coordinates) {
	const busStopLat = coordinates.lat;
	const BusStopLong = coordinates.lng;
	const streetView = "http://maps.google.com/maps?q=&layer=c&cbll=" + busStopLat + "," + BusStopLong;
	console.log('streetView',streetView)
	return streetView
}

function getDirectionsLink(originCoords, destCoords, arrivalTimeMoment) {
	const originLat = originCoords.lat;
	const originLong = originCoords.long;
	const destLat = destCoords.lat
	const destLong = destCoords.long

	const arrivalTimeUnix = moment.tz(arrivalTimeMoment.format('YYYY-MM-DDTHH:mm:ss'), 'utc').unix()
	const directionsWork = `https://www.google.com/maps/dir/${originLat},${originLong}/${destLat},${destLong}/data=!3m1!4b1!4m6!4m5!2m3!6e1!7e2!8j${arrivalTimeUnix}!3e3`

	return directionsWork
}

function getDirectionsLinkByDepTime(originCoords, destCoords, depTimeMoment) {
	const originLat = originCoords.lat;
	const originLong = originCoords.long;
	const destLat = destCoords.lat
	const destLong = destCoords.long

	const depTimeUnix = moment.tz(depTimeMoment.format('YYYY-MM-DDTHH:mm:ss'), 'utc').unix()
	const directionsWork = `https://www.google.com/maps/dir/${originLat},${originLong}/${destLat},${destLong}/data=!3m1!4b1!4m6!4m5!2m3!6e0!7e2!8j${depTimeUnix}!3e3`
	return directionsWork
}

async function processMessagingItem(messagingItem) {
	const { recipient, timestamp, sender, postback, message } = messagingItem
	const recipientId = recipient.id
	const senderId = sender.id
	let userSettings = await UserSettings.findOne({ where: { senderId } })

	if (message) { // usually a location attachment
		const { mid, seq, attachments } = message
		if (attachments) {
			for (let i = 0; i < attachments.length; i++) {
				const attachment = attachments[i]
				switch (attachment.type) {
					case 'location': 
						const attachmentPayload = attachment.payload
						const { coordinates } = attachmentPayload
						if (userSettings) {
							const homeCoords = { lat: userSettings.homeLat, long: userSettings.homeLong };
							const workCoords = { lat: userSettings.workLat, long: userSettings.workLong };

							if (userSettings.currentLocationIntent == 'GO_HOME') {
								userSettings.currentLocationIntent = ""
								await userSettings.save()

								const now = moment()
								try {
									const busStopData = await getBusRouteDataByDepTime(coordinates, homeCoords, now)
									const busNumber = getBusNumber(busStopData)
									const busStopCoordinates = getBusStopLocation(busStopData)
									const streetViewLink = getStreetViewLink(busStopCoordinates)
									const busStopTime = getBusStopTime(busStopData)
									const busLeavesIn = busStopTime.diff(moment(), 'minutes')
									const url = getDirectionsLinkByDepTime(coordinates, homeCoords, now)

									await sendLinkMessageStreetView(sender, `This is your bus stop.`, url, 'Street View')
									await sendLinkMessage(sender, `The next bus will arrive in ${busLeavesIn} minutes (${busNumber}). Leave in 5 min.`, url, 'Where to go')
								}
								catch (error) {
									console.log('error',error)
									await sendMessage(sender, 'No routes for your bus found :-(. Try Uber or Lime?')
								}

								
							}
							else if (userSettings.currentLocationIntent == 'GO_TO_WORK') {
								userSettings.currentLocationIntent = ""
								await userSettings.save()

								const now = moment()
								try {
									const busStopData = await getBusRouteDataByDepTime(coordinates, workCoords, now)
									const busNumber = getBusNumber(busStopData)
									const busStopCoordinates = getBusStopLocation(busStopData)
									const streetViewLink = getStreetViewLink(busStopCoordinates)
									const busStopTime = getBusStopTime(busStopData)
									const busLeavesIn = busStopTime.diff(moment(), 'minutes')
									const url = getDirectionsLinkByDepTime(coordinates, workCoords, now)

									await sendLinkMessageStreetView(sender, `This is your bus stop.`, url, 'Street View')
									await sendLinkMessage(sender, `The next bus will arrive in ${busLeavesIn} minutes (${busNumber}). Leave in 5 min.`, url, 'Where to go')
								}
								catch (error) {
									console.log('error',error)
									await sendMessage(sender, 'No routes for your bus found :-(. Try Uber or Lime?')
								}
								
							}
							else if (userSettings.homeLat && userSettings.homeLong) {
								userSettings.workLat = coordinates.lat
								userSettings.workLong = coordinates.long
								await userSettings.save()
								await sendWhenPrompt(sender, "Awesome, when do you want to in the office by? And on which days do you want to use public transit?")
							}
							else {
								userSettings.homeLat = coordinates.lat
								userSettings.homeLong = coordinates.long
								await userSettings.save()
								await sendCurrentLocationPrompt(sender, "Next, where do you work or study?")
							}
						}
						else {
							userSettings = await UserSettings.create({
								senderId,
								homeLat: coordinates.lat,
								homeLong: coordinates.long,
							})
							await sendCurrentLocationPrompt(sender, "Next, where do you work or study?")
						}
						break
				}
			}			
		}
		else {
			// skip
		}
	}
	else { // usually a postback message
		if (postback) {
			const postbackPayload = postback.payload
			const postbackTitle = postback.title

			switch (postbackPayload) {
				case 'SETTINGS_PAYLOAD':
				case 'GET_STARTED_PAYLOAD':
					if (userSettings) {
						userSettings.workLat = 0
						userSettings.workLong = 0
						userSettings.homeLat = 0
						userSettings.homeLong = 0
						await userSettings.save()
					}
					else {
						userSettings = await UserSettings.create({
							senderId,
							workLat: 0,
							workLong: 0,
							homeLat: 0,
							homeLong: 0,
						})
					}

					await sendMessage(sender, "Kia ora! I can make getting used to a new bus route easier!")
					await sendCurrentLocationPrompt(sender, "First of all, where do you live?")
					break
				case 'GO_HOME_PAYLOAD':
					if (userSettings) {
						userSettings.currentLocationIntent = 'GO_HOME'
						await userSettings.save()
						await sendCurrentLocationPrompt(sender, "Where you are right now?")
					}
					else {
						await sendMessage(sender, 'Please finish initial settings to use Go Home and Go to work.')
					}
					break;
				case 'GO_TO_WORK_PAYLOAD':
					if (userSettings) {
						userSettings.currentLocationIntent = 'GO_TO_WORK'
						await userSettings.save()
						await sendCurrentLocationPrompt(sender, "Where you are right now?")
					}
					else {
						await sendMessage(sender, 'Please finish initial settings to use Go Home and Go to work.')
					}
					break;
			}
		}
		else {
			// this is not message, a read receipt or something
		}		
	}

}


module.exports = (app) => {

	app.get('/messenger', (req, res) => {
		const mode = req.query['hub.mode']
		const verify_token = req.query['hub.verify_token']
		const challenge = req.query['hub.challenge']

	  if (mode === 'subscribe' && verify_token === 'VERY_RANDOM_BUS_BUDDY_STRING') {
	    console.log('[WEBHOOK] Successful validation');
	    res.status(200)
	    res.send(challenge)
	  } else {
	    console.log('[WEBHOOK] Failed validation');
	    res.status(200)
	    res.send('')
	  }
	})

	app.post('/messenger', (req, res) => {
		const { body } = req
		const { object, entry } = body
		for (let i = 0; i < entry.length; i++) {
			const entryItem = entry[i];
			const { messaging } = entryItem
			for (let j = 0; j < messaging .length; j++) {
				const messagingItem = messaging[j]
				processMessagingItem(messagingItem)
			}
		}
		res.send({ success: true })
	})

	app.get('/minute-tick', async (req, res) => {
		const { nowTime } = req.query
		const nowtimeMoment = nowTime ? moment(nowTime) : moment()
		const userSettingsEntries = await UserSettings.findAll({})
	
		console.log('nowtimeMoment',nowtimeMoment.format())
		for (var i = 0; i < userSettingsEntries.length; i++) {
			const userSettings = userSettingsEntries[i]

			const senderId = userSettings.senderId
			const sender = { id: senderId }
			const homeCoords = { lat: userSettings.homeLat, long: userSettings.homeLong };
			const workCoords = { lat: userSettings.workLat, long: userSettings.workLong };
			const arrivalTime = getNextArrivalTimeMoment(userSettings)			
			if (arrivalTime) {
				console.log('senderId', senderId, 'arrivalTime.format()',arrivalTime.format())
				const url = getDirectionsLink(homeCoords, workCoords, arrivalTime)
			  const busStopData = await getBusRouteData(homeCoords, workCoords, arrivalTime)
				const departureTime = getCommuteDepartureTime(busStopData)

				if (departureTime) {
					const busStopTime = getBusStopTime(busStopData)
					const busNumber = getBusNumber(busStopData)
					const busLeavesIn = busStopTime.diff(moment(), 'minutes')

					console.log('senderId', senderId, 'departureTime.format()', departureTime.format())

					if (Math.abs(departureTime.clone().subtract(35, 'minutes').diff(nowtimeMoment.clone(), 'minutes', true)) < 1) {
						await sendLinkMessage(sender, `You should get ready to leave for work! The next bus will arrive in ${busLeavesIn} minutes (${busNumber}). Leave in 30 minutes`, url, 'Where to go')
					}
					else if (Math.abs(departureTime.clone().subtract(15, 'minutes').diff(nowtimeMoment.clone(), 'minutes', true)) < 1) {
						await sendLinkMessage(sender, `Heads up, leave the house in 10 mins! The bus will arrive in ${busLeavesIn} minutes (${busNumber})`, url, 'Where to go')
					}					
				}
				else {
					// trip is too short.
				}
			}
			else {
				// the notifications is not set up proerply
			}
		};

		res.send({ success: true })
	})

	app.get('/disruption-alert/', async (req, res) => {
		const { query } = req
		const { senderId, busNumber, arrivalTime } = query

		let userSettings = await UserSettings.findOne({ where: { senderId } })
		const sender = { id: senderId }
		const homeCoords = { lat: userSettings.homeLat, long: userSettings.homeLong };
		const workCoords = { lat: userSettings.workLat, long: userSettings.workLong };

		const uberArrivalTimeCopy = moment(arrivalTime).add(06, 'minutes').format("h:mmA")
		const limeArrivalTimeCopy = moment(arrivalTime).add(16, 'minutes').format("h:mmA")
		const carArrivalTimeCopy = moment(arrivalTime).add(04, 'minutes').format("h:mmA")
		const url = getDirectionsLink(homeCoords, workCoords, moment(arrivalTime).add(30, 'minutes'))

		await sendDisruptionMessage(sender, `Something has happened to your bus (${busNumber}). The next one is in 30 minutes. \n\nAlternatively you can take:\n\nan Uber - arrive by ${uberArrivalTimeCopy}\na Lime - arrive by ${limeArrivalTimeCopy}\na car - arrive by ${carArrivalTimeCopy}`, url)
		res.send({success:true})

	})

	app.get('/user-settings/', async (req, res) => {
		const { query } = req
		const { senderId } = query
		let userSettings = await UserSettings.findOne({ where: { senderId } })
	  res.send({ success: true, userSettings })
	})

	app.put('/user-settings/', async (req, res) => {
		const { body } = req
		const {
			senderId,
			officeArrivalTime,
			isMondayEnabled,
			isTuesdayEnabled,
			isWednesdayEnabled,
			isThursdayEnabled,
			isFridayEnabled,
			isSaturdayEnabled,
			isSundayEnabled,
		} = body.userSettings
		const sender = { id: senderId }

		let userSettings = await UserSettings.findOne({ where: { senderId } })
		if (userSettings) {
			console.log('userSettings', userSettings.get({ plain: true }))

			userSettings.officeArrivalTime = officeArrivalTime
			userSettings.isMondayEnabled = isMondayEnabled
			userSettings.isTuesdayEnabled = isTuesdayEnabled
			userSettings.isWednesdayEnabled = isWednesdayEnabled
			userSettings.isThursdayEnabled = isThursdayEnabled
			userSettings.isFridayEnabled = isFridayEnabled
			userSettings.isSaturdayEnabled = isSaturdayEnabled
			userSettings.isSundayEnabled = isSundayEnabled
			await userSettings.save()

			const homeCoords = { lat: userSettings.homeLat, long: userSettings.homeLong };
			const workCoords = { lat: userSettings.workLat, long: userSettings.workLong };
			const arrivalTime = getNextArrivalTimeMoment(userSettings)
			if (arrivalTime) {
				try {
				  const busStopData = await getBusRouteData(homeCoords, workCoords, arrivalTime)
					const departureTime = getCommuteDepartureTime(busStopData)
					if (departureTime) {
						const busStopCoordinates = getBusStopLocation(busStopData)
						const streetViewLink = getStreetViewLink(busStopCoordinates)
						const departureTimeCopy = departureTime.format('h:mmA')

						await sendMessage(sender, `Cool! I will help you get used to your new commute. Your departure time is ${departureTimeCopy}. You'll receive the alarm 30 minutes before departure.`)
						await sendLinkMessageStreetView(sender, 'Get to know your bus stop!', streetViewLink, 'Street View')
					}
					else {
						await sendMessage(sender, 'It looks like this route doesn\'t have a bus trip')
					}
				}
				catch (error) {
					console.log('error',error)
					await sendMessage(sender, 'No routes for your bus found :-(. Try setting your settings again.')
				}
			}
			else {
				await sendWhenPrompt(sender, "You haven't selected the days you want to go to work.")
			}
		}
		else {
			await sendMessage(sender, 'Work and home locations are not set. Try setting your settings again.')
		}

	  res.send({ success: true, userSettings })
	})
}

(async () => {
	await rp({
	  method: 'POST',
	  uri: `https://graph.facebook.com/v2.6/me/messenger_profile?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
	  body: {
	  	"get_started": {
	  	  "payload": "GET_STARTED_PAYLOAD",
	  	},
	  	"greeting": [
	  	  {
	  	    "locale": "default",
	  	    "text": "Helps you get used to your bus routes",
	  	  }
	  	],
	  	"persistent_menu":[
	  	  {
	  	    "locale":"default",
	  	    "composer_input_disabled": true,
	  	    "call_to_actions":[
	  	      {
	            "title":"Go home",
	            "type":"postback",
	            "payload":"GO_HOME_PAYLOAD"
	          },
	  	      {
	            "title":"Go to work",
	            "type":"postback",
	            "payload":"GO_TO_WORK_PAYLOAD"
	          },
	  	      {
	            "title":"Reset settings",
	            "type":"postback",
	            "payload":"SETTINGS_PAYLOAD"
	          }
	  	    ]
	  	  }
	  	]
	  },
	  json: true,
	})
})()
