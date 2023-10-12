const telegrambot = require("node-telegram-bot-api");
require("dotenv").config();
const axios = require("axios");
const { default: mongoose } = require("mongoose");
const subscriber = require("../models/subscriber");
const schedule = require("node-schedule");
const countries = require("./countries");
const weatherIcons = require("./weathericons");
// const sendDailyMessages = require("../tasks/sendDailyMessage");
const apiKey = process.env.WEATHER_API_KEY;
const token = process.env.TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new telegrambot(token, { polling: true });

// connect to MongoDB
mongoose.connect(process.env.MONGO_URL).then(() => console.log("Connected!"));

// Two Type Of bot messages input has been handled
bot.on("message", handleMessage);
bot.on("location", handleLocation);
// Schedule the job to run daily at a specific time (e.g., 12:00 PM)
const job = schedule.scheduleJob({ hour: 8, minute: 30 }, sendDailyMessages);

// Function to send daily messages to users
async function sendDailyMessages() {
  try {
    // Retrieve user data from the database
    const users = await subscriber.find({});
    users.map(async (user) => {
      console.log(user);
      // bot.sendMessage(user.chatId, `Good Morning, ${user.name} `);
      const coordsApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${user.lat}&lon=${user.lon}&appid=${apiKey}`;
      const coordsCityUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${user.lat}&lon=${user.lon}&appid=${apiKey}`;
      // bot.sendMessage(user.chatId, coordsApiUrl);
      try {
        const response = await axios.get(coordsApiUrl);
        const jsonData = response.data;

        const cityResponse = await axios.get(coordsCityUrl);
        const cityJsonData = cityResponse.data;

        const weatherMessage = generateWeatherMessage(
          jsonData,
          cityJsonData,
          "message"
        );

        // Use the HTML parse_mode option to format the message as HTML
        bot.sendMessage(user.chatId, weatherMessage, {
          parse_mode: "Markdown",
        });
        console.log(weatherMessage);
      } catch (error) {
        console.log("failed to send daily update");
      }
    });
  } catch (error) {
    console.error("Error sending daily messages:", error.message);
  }
}

function getNameByCode(codeToFind) {
  const country = countries.find((country) => country.code === codeToFind);
  return country ? country.name : "Country not found";
}

function getWindDirection(degrees) {
  // Define an array of directions in clockwise order
  const compassDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];

  // Define an array of arrow icons in clockwise order
  const arrowIcons = ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️", "⬆️"];

  // Calculate the index based on the degrees
  const index = Math.round((degrees % 360) / 45);

  // Get the corresponding compass direction and arrow icon
  const compassDirection = compassDirections[index];
  const arrowIcon = arrowIcons[index];

  // Return both the compass direction and arrow icon
  return `💨 ${compassDirection}, ${arrowIcon}`;
}

function timestampToTime(timestamp) {
  // Convert the timestamp to milliseconds
  const date = new Date(timestamp * 1000);

  // Extract hours and minutes
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Format the time as HH:MM AM/PM
  const timeString = `${hours % 12}:${minutes < 10 ? "0" : ""}${minutes} ${
    hours >= 12 ? "PM" : "AM"
  }`;

  return timeString;
}

function getSunriseSunsetIcon(sunriseTimestamp, sunsetTimestamp) {
  const now = new Date().getTime() / 1000; // Current time in seconds
  const thirtyMinutes = 30 * 60; // 30 minutes in seconds

  if (now < sunriseTimestamp - thirtyMinutes) {
    return "🌃🌃🌃 NIGHT 🌃🌃🌃"; // Return a night icon if it's before 30 minutes prior to sunrise.
  } else if (
    now >= sunriseTimestamp - thirtyMinutes &&
    now < sunriseTimestamp
  ) {
    return "🌅🌅🌅 SUNRISE 🌅🌅🌅"; // Return a sunrise icon 30 minutes before sunrise.
  } else if (now >= sunsetTimestamp) {
    return "🌆🌆🌆 EVENING 🌆🌆🌆"; // Return a sunset icon if it's after sunset.
  } else {
    return "☀️☀️☀️ DAY ☀️☀️☀️"; // Return a generic sun icon for other daytime hours.
  }
}

function temperatureFormat(temperatureInKelvin) {
  // Convert temperature from Kelvin to Celsius
  const temperatureInCelsius = temperatureInKelvin - 273.15;

  // Define threshold values for emojis
  const coldThreshold = 10;
  const hotThreshold = 30;

  // Determine the appropriate emoji based on the temperature
  let emoji = "🙂"; // Default emoji (neutral)

  if (temperatureInCelsius < coldThreshold) {
    emoji = "🥶"; // Cold emoji
  } else if (temperatureInCelsius > hotThreshold) {
    emoji = "🥵"; // Hot emoji
  }

  return `${temperatureInCelsius.toFixed(1)} °C   ${emoji}`;
}

function getCountryFlagEmoji(countryCode) {
  // Ensure the country code is in uppercase
  countryCode = countryCode.toUpperCase();

  // Use the Unicode code points for flag emojis
  const A_CODE_POINT = 127462; // Code point for letter A
  const Z_CODE_POINT = 127487; // Code point for letter Z

  let flagEmoji = "";

  for (let i = 0; i < countryCode.length; i++) {
    const charCode = countryCode.charCodeAt(i);
    if (charCode >= 65 && charCode <= 90) {
      const flagChar = String.fromCodePoint(charCode + (A_CODE_POINT - 65));
      flagEmoji += flagChar;
    }
  }

  return flagEmoji;
}

function generateWeatherMessage(jsonData, cityJsonData, userInputType) {
  // Get the weather icon based on the condition
  // Default icon for unknown conditions
  const weatherIcon = weatherIcons[jsonData.weather[0].description] || "❓";
  return `
  🟢 *Todays Weather Report* 🟢
  ------------------------------------------
  ${getSunriseSunsetIcon(jsonData.sys.sunrise, jsonData.sys.sunset)}

  *${cityJsonData[0].name}  ${
    jsonData.name != cityJsonData[0].name ? `( ${jsonData.name} )` : ""
  } 
  ${cityJsonData[0].state ? `${cityJsonData[0].state},` : ""} ${getNameByCode(
    cityJsonData[0].country
  )} ${getCountryFlagEmoji(cityJsonData[0].country)}*
  
  ------------------------------------------
  
  Weather          : *${jsonData.weather[0].description.toUpperCase()}*  ${weatherIcon}
  Temperature  : ${(jsonData.main.temp - 273.15).toFixed(1)} °C
  Feels Like       : ${temperatureFormat(jsonData.main.feels_like)}
  Humidity         : ${jsonData.main.humidity}%
  Wind Speed    : ${jsonData.wind.speed} m/s ${
    jsonData.wind.speed ? getWindDirection(jsonData.wind.deg) : ""
  }
  
  ------------------------------------------

  Sunrise : ${timestampToTime(jsonData.sys.sunrise)}  🌄
  Sunset  : ${timestampToTime(jsonData.sys.sunset)}  🌃

  Minimum Temperature  : ${(jsonData.main.temp_min - 273.15).toFixed(1)} °C
  Maximum Temperature : ${(jsonData.main.temp_max - 273.15).toFixed(1)} °C

  Pressure : ${jsonData.main.pressure} mb

  ------------------------------------------
  ${
    userInputType == "message"
      ? `
  To Update location for Daily Weather 
  Share Your Current Location
    `
      : `
  Your subscription location 
  has been updated 
      `
  }
  


  `;
}

async function handleLocation(msg) {
  let lat = msg.location.latitude;
  let lon = msg.location.longitude;

  let chat_id = msg.from.id;

  console.log(lat, lon);
  const coordsApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  const coordsCityUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  try {
    const response = await axios.get(coordsApiUrl);
    // Extract the data from the response
    const jsonData = response.data;

    const cityResponse = await axios.get(coordsCityUrl);
    const cityJsonData = cityResponse.data;

    // Send a bold message
    const weatherMessage = generateWeatherMessage(
      jsonData,
      cityJsonData,
      "location"
    );

    // Use the HTML parse_mode option to format the message as HTML
    bot.sendMessage(chat_id, weatherMessage, { parse_mode: "Markdown" });
    console.log(weatherMessage);
    try {
      // Remove the user by chatId
      const result = await subscriber.deleteOne({ chatId: chat_id });
      const newSubscriber = new subscriber({
        chatId: chat_id,
        name: msg.from.first_name + " " + msg.from.last_name,
        username: msg.from.username,
        lat: jsonData.coord.lat,
        lon: jsonData.coord.lon,
        location:
          jsonData.name +
          " - " +
          cityJsonData[0].state +
          ", " +
          getNameByCode(cityJsonData[0].country),
      });
      console.log(newSubscriber);
      // Save the user to the database
      const savedUser = await newSubscriber.save();
      console.log("User saved:", savedUser);
    } catch (error) {
      console.log("error creating subscriber 2 " + error.message);
    }
  } catch (error) {
    let errorMessage = "City Not Found";
    console.error(errorMessage);
    // bot.sendMessage(chat_id, errorMessage);
  }
}

async function handleMessage(msg) {
  // console.log(msg);
  if (!msg.text) {
    return;
  }
  let chat_id = msg.from.id;
  console.log(msg.text + " - " + chat_id);
  if (msg.text == "/start") {
    const welcomeMsg = `
    *Welcome to Daily Weather 🌤️*

    📌 share your *location* 📌
    to get Daily weather information
    
    Also you can get other city
    weathers by texting city name
    `;
    bot.sendMessage(chat_id, welcomeMsg, { parse_mode: "Markdown" });
    return;
  }

  let city = msg.text;
  const coordsCityUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${apiKey}`;
  try {
    const cityResponse = await axios.get(coordsCityUrl);
    const cityJsonData = cityResponse.data;

    const cityApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityJsonData[0].name}&appid=${apiKey}`;
    const response = await axios.get(cityApiUrl);
    // Extract the data from the response
    const jsonData = response.data;

    console.log(jsonData.weather[0].main);
    // Send a bold message
    const weatherMessage = generateWeatherMessage(
      jsonData,
      cityJsonData,
      "message"
    );
    // Use the HTML parse_mode option to format the message as HTML
    bot.sendMessage(chat_id, weatherMessage, { parse_mode: "Markdown" });
    console.log(weatherMessage);
  } catch (error) {
    let errorMessage = "City Not Found";
    console.error(errorMessage);
    // bot.sendMessage(chat_id, errorMessage);
  }
}
