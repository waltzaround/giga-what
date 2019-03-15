const rp = require('request-promise');

function sendMessage(recipient, messageText) {
	rp({
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

function processMessagingItem(messagingItem) {
	const { recipient, timestamp, sender, postback} = messagingItem
	const recipientId = recipient.id
	const senderId = sender.id
	if (postback) {
		const postbackPayload = postback.payload
		const postbackTitle = postback.title

		switch (postbackPayload) {
			case 'GET_STARTED_PAYLOAD':
				sendMessage(sender, "Hey there! I can make getting used to a new bus route easier!")
				break
		}
	}
	else {
		// this is not message, a read receipt or something
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
		for (var i = 0; i < entry.length; i++) {
			const entryItem = entry[i];
			const { messaging } = entryItem
			for (var i = 0; i < messaging .length; i++) {
				const messagingItem = messaging[i]
				console.log('messagingItem',messagingItem)
				processMessagingItem(messagingItem)
			};
			console.log('entryItem',entryItem)
		};

		// console.log('object', object)
		// console.log('entry', entry)

		res.send({ success: true })
	})

	app.put('/user-settings/', (req, res) => {
		const { body } = req
		const { userSettings, senderId } = body
		const { officeArrivalTime, isMondayEnabled, isTuesdayEnabled, isWednesdayEnabled, isThursdayEnabled, isFridayEnabled, isSaturdayEnabled, isSundayEnabled } = userSettings

	  res.send({ success: true })
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
	  },
	  json: true,
	})
})()
