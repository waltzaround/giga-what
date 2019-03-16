require('dotenv').config()

const express = require('express')
const opn = require('opn');
const app = express()
const port = 3000

const morgan = require('morgan')
const bodyParser = require('body-parser')
const rp = require('request-promise');

app.use(morgan('combined'))
app.use(bodyParser.json())

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});
require('./messenger')(app);

app.get('/', async (req, res) => res.send(await getWeather(-36.846178, 174.766155)))
app.get('/dirWork', (req, res) => res.send(opn(directionsWork)))
app.get('/dirHome', (req, res) => res.send(opn(directionsHome)))
app.get('/sview', (req, res) => res.send(opn(streetView)))
app.get('/bstop', (req, res) => res.send(data))
app.get('/weather', (req, res) => res.send(opn(weather)));


app.listen(port, () => console.log(`Example app listening on port ${port}!`))


//Get Bus Weather
const areaLat = -36.846178;
const areaLong = 174.766155;
const weatherAPI = "5c7e05cd01783455a05f254388393cc5";

const weather = "http://api.openweathermap.org/data/2.5/weather?lat=" + areaLat + "&lon=" + areaLong + "&appid=" + weatherAPI;

async function getWeather(areaLat, areaLong) {
    const data = await rp({
        uri: 'http://api.openweathermap.org/data/2.5/weather',
        qs: {
            'lat': `${areaLat}`,
            'lon': `${areaLong}`,
            'appid': `${weatherAPI}`,
        },
        json: true,
    })

  const weather = (data.weather[0].main)
  return weather
}

(async () => {
    console.log(await getWeather(-36.846178, 174.766155))
})()
