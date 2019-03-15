require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const rp = require('request-promise');
const app = express()
const port = 3000

app.use(morgan('combined'))
app.use(bodyParser.json())

app.get('/', (req, res) => res.send('Giga-Whaaat??!'))

require('./messenger')(app);


app.listen(port, () => console.log(`Example app listening on port ${port}!`))

