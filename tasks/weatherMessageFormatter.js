const countries = require("../src/countries");

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

function getNameByCode(codeToFind) {
  const country = countries.find((country) => country.code === codeToFind);
  return country ? country.name : "Country not found";
}

module.exports = {
  getCountryFlagEmoji,
  getSunriseSunsetIcon,
  timestampToTime,
  getNameByCode,
  getWindDirection,
  temperatureFormat,
};
