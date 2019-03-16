require('dotenv').config()

const express = require('express')
const opn = require('opn');
const morgan = require('morgan')
const bodyParser = require('body-parser')
const rp = require('request-promise');
const app = express()
const port = 3000

app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});
require('./messenger')(app);

app.get('/', (req, res) => res.send("Hello World!"))
app.get('/dirWork', (req, res) => res.send(opn(directionsWork)))
app.get('/dirHome', (req, res) => res.send(opn(directionsHome)))
app.get('/sview', (req, res) => res.send(opn(streetView)))


app.listen(port, () => console.log(`Example app listening on port ${port}!`))

//Directions Map Launch
const originLat = -36.848386;
const originLong = 174.765487;
const destLat = -36.850324;
const destLong = 174.755381;

const arrivalTime = new Date('2019.03.17').getTime() / 1000;
const departTime = 1700;

const directionsWork = "https://www.google.com/maps/dir/?api=1&origin=" + originLat + "," + originLong + "&destination=" + destLat + "," + destLong + "&travelmode=transit&arrival_time=" + arrivalTime;
const directionsHome = "https://www.google.com/maps/dir/?api=1&destination=" + originLat + "," + originLong + "&origin=" + destLat + "," + destLong + "&travelmode=transit&departure_time=" + departTime;


//Open Street View
const busStopLat = -36.846178;
const BusStopLong = 174.766155;

const streetView = "http://maps.google.com/maps?q=&layer=c&cbll=" + busStopLat + "," + BusStopLong;

