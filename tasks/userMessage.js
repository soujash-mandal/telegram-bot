const weatherIcons = require("../src/weathericons");
const {
  getCountryFlagEmoji,
  getSunriseSunsetIcon,
  timestampToTime,
  getNameByCode,
  getWindDirection,
  temperatureFormat,
} = require("./weatherMessageFormatter");

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
    Visibility          : ${(jsonData.visibility / 1000).toFixed(1)} km 🔭
    Clouds             : ${jsonData.clouds.all} % ☁️
    
    ------------------------------------------
  
    Sunrise : ${timestampToTime(jsonData.sys.sunrise + 330 * 60)}  🌄
    Sunset  : ${timestampToTime(jsonData.sys.sunset + 330 * 60)}  🌃
  
    ☀️ ${(jsonData.main.temp_max - 273.15).toFixed(1)} °C    🌙 ${(
    jsonData.main.temp_min - 273.15
  ).toFixed(1)} °C
  
    Pressure : ${jsonData.main.pressure} mb ${
    jsonData.main.pressure < 1010 ? "🔻" : ""
  }${jsonData.main.pressure < 1000 ? "🔻" : ""}${
    jsonData.main.pressure < 970 ? "🔻" : ""
  }
  
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

module.exports = generateWeatherMessage;
