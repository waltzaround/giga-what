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


app.get('/', async (req, res) => res.send(await getWeather(-36.846178, 174.766155)))
app.get('/dirWork', (req, res) => res.send(opn(directionsWork)))
app.get('/dirHome', (req, res) => res.send(opn(directionsHome)))
app.get('/sview', (req, res) => res.send(opn(streetView)))
app.get('/bstop', (req, res) => res.send(data))
app.get('/weather', (req, res) => res.send(opn(weather)));


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

//Bus Stop Locations
// const apiKey = "";
// async function getBusStopLocation() {
//     const data = await rp({ uri: 'https://maps.googleapis.com/maps/api/directions/json?origin=-36.848386,174.765487&destination=-36.850324,174.755381&mode=transit&key=', json:true })
//     console.log(data)
//     for (const i = 0; i < 3; i++) {
//         data.routes[0].legs[0].steps[i]
//     }
    

//     return location
// }
// getBusStopLocation()


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
