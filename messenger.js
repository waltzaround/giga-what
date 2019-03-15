function sendMessage() {
	rp({
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
	  json: true // Automatically stringifies the body to JSON
	})

}

function processMessagingItem(messagingItem) {
	const { recipient, timestamp, sender, postback} = messagingItem
	if (postback.payload === 'GET_STARTED_PAYLOAD') {

	}
	// recipient: { id: '438096070290317' },
	// timestamp: 1552681916027,
	// sender: { id: '2052050591581851' },
	// postback:
	//  { payload:
	//     'Hey there! I can make getting used to a new bus route easier!',
	//    title: 'Get Started' } }
}
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
		};
		console.log('entryItem',entryItem)
	};

	console.log('object', object)
	console.log('entry', entry)

	res.send({ success: true })
})

app.put('/user-settings/', (req, res) => {
	const { body } = req
	const { userSettings, senderId } = body
	const { officeArrivalTime, isMondayEnabled, isTuesdayEnabled, isWednesdayEnabled, isThursdayEnabled, isFridayEnabled, isSaturdayEnabled, isSundayEnabled } = userSettings

  res.send({ success: true })
})


rp({
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
  json: true // Automatically stringifies the body to JSON
})
.then(function (parsedBody) {
    // POST succeeded...
})
.catch(function (err) {
    // POST failed...
});
