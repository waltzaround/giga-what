const rp = require('request-promise');

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
	  	      "title": "Send Location",
	  	      "payload": "HOME_POSTBACK_PAYLOAD",
	  	      "image_url": "http://example.com/img/red.png"
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
	  	      "title": "Send Location",
	  	      "payload": "WORK_POSTBACK_PAYLOAD",
	  	      "image_url": "http://example.com/img/red.png"
	  	    },
	  	  ]
	  	},
	  },
	  json: true,
	})
}

async function processMessagingItem(messagingItem) {
	const { recipient, timestamp, sender, postback, message } = messagingItem
	const recipientId = recipient.id
	const senderId = sender.id

	if (message) { // usually a location attachment
		const { mid, seq, attachments } = message
		console.log('attachments', attachments)
		for (let i = 0; i < attachments.length; i++) {
			const attachment = attachments[i]
			switch (attachment.type) {
				case 'location': 
					const attachmentPayload = attachment.payload
					const { coordinates } = attachmentPayload
					console.log('coordinates', coordinates)
					await sendWorkPrompt(sender, "Next, where do you work or study?")
					break
			}
		}

	}
	else { // usually a postback message
		if (postback) {
			const postbackPayload = postback.payload
			const postbackTitle = postback.title

			switch (postbackPayload) {
				case 'GET_STARTED_PAYLOAD':
					await sendMessage(sender, "Hey there! I can make getting used to a new bus route easier!")
					await sendHomePrompt(sender, "First of all, where do you live?")
					break
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

	app.put('/user-settings/', (req, res) => {
		const { body } = req
		const { userSettings, senderId } = body
		const { officeArrivalTime, isMondayEnabled, isTuesdayEnabled, isWednesdayEnabled, isThursdayEnabled, isFridayEnabled, isSaturdayEnabled, isSundayEnabled } = userSettings

	  res.send({ success: true, userSettings, senderId })
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
