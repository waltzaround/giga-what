const rp = require('request-promise');
const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

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

async function sendHomePrompt(recipient, messageText) {
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

async function sendWorkPrompt(recipient, messageText) {
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
	  	          "url": `https://a59153f1.ngrok.io/?senderId=${recipient.id}`,
	  	          "title": "Select",
	  	          "webview_height_ratio": "Compact",
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
	  	        }
	  	      ]
	  	    }
	  	  }
	  	},
	  },
	  json: true,
	})

}

function getStreetViewLink(coordinates) {
	const busStopLat = -36.8555378;
	const BusStopLong = 174.8238183;
	const streetView = "http://maps.google.com/maps?q=&layer=c&cbll=" + busStopLat + "," + BusStopLong;
	return streetView
}

function thirtyMinsBefore() {

}

async function processMessagingItem(messagingItem) {
	const { recipient, timestamp, sender, postback, message } = messagingItem
	const recipientId = recipient.id
	const senderId = sender.id

	if (message) { // usually a location attachment
		const { mid, seq, attachments } = message
		console.log('attachments', attachments)
		if (attachments) {
			for (let i = 0; i < attachments.length; i++) {
				const attachment = attachments[i]
				switch (attachment.type) {
					case 'location': 
						const attachmentPayload = attachment.payload
						const { coordinates } = attachmentPayload
						console.log('coordinates', coordinates)
						let userSettings = await UserSettings.findOne({ senderId })
						if (userSettings) {
							if (userSettings.homeLat && userSettings.homeLong) {
								userSettings.workLat = coordinates.lat
								userSettings.workLong = coordinates.long
								await userSettings.save()
								await sendWhenPrompt(sender, "Awesome, when you want to be at office at? And at what says you want to use public transit?")
							}
							else {
								userSettings.homeLat = coordinates.lat
								userSettings.homeLong = coordinates.long
								await userSettings.save()
								await sendWorkPrompt(sender, "Next, where do you work or study?")
							}
						}
						else {
							userSettings = await UserSettings.create({
								senderId,
								homeLat: coordinates.lat,
								homeLong: coordinates.long,
							})
							await sendWorkPrompt(sender, "Next, where do you work or study?")
						}
						console.log('userSettings', userSettings)
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
					let userSettings = await UserSettings.findOne({ where: { senderId } })
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

					await sendMessage(sender, "Hey there! I can make getting used to a new bus route easier!")
					await sendHomePrompt(sender, "First of all, where do you live?")
					break
				case 'GO_HOME_PAYLOAD':
					break;
				case 'GO_TO_WORK_PAYLOAD':
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
	    console.error('[WEBHOOK] Failed validation');
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
				console.log('messagingItem',messagingItem)
				processMessagingItem(messagingItem)
			}
			console.log('entryItem',entryItem)
		}

		res.send({ success: true })
	})

	app.get('/user-settings/', (req, res) => {
	  res.send({ success: false, error: 'This is a PUT route, not GET' })
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

		let userSettings = await UserSettings.findOne({ where: { senderId } })
		if (userSettings) {
			console.log('userSettings',userSettings)

			userSettings.officeArrivalTime = officeArrivalTime
			userSettings.isMondayEnabled = isMondayEnabled
			userSettings.isTuesdayEnabled = isTuesdayEnabled
			userSettings.isWednesdayEnabled = isWednesdayEnabled
			userSettings.isThursdayEnabled = isThursdayEnabled
			userSettings.isFridayEnabled = isFridayEnabled
			userSettings.isSaturdayEnabled = isSaturdayEnabled
			userSettings.isSundayEnabled = isSundayEnabled
			await userSettings.save()

			await sendMessage({ id: senderId }, 'Cool! I will help you get used to your new commute. You\'ll receive the alarm 30 minutes before departure.')
			const busStopCoordinates = {}
			await sendLinkMessage({ id: senderId }, 'Get to know your bus stop!', getStreetViewLink(busStopCoordinates), 'Street View')
			

			// if (userSettings.homeLat && userSettings.homeLong) {
			// 	userSettings.workLat = coordinates.lat
			// 	userSettings.workLong = coordinates.long
			// 	await userSettings.save()
			// 	await sendWhenPrompt(sender, "Awesome, when you want to be at office at? And at what says you want to use public transit?")
			// }
			// else {
			// 	userSettings.homeLat = coordinates.lat
			// 	userSettings.homeLong = coordinates.long
			// 	await userSettings.save()
			// 	await sendWorkPrompt(sender, "Next, where do you work or study?")
			// }
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
	            "title":"Settings",
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
