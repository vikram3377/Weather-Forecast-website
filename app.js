const searchForm = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const statusMessage = document.querySelector("#status-message");
const resultSection = document.querySelector("#result-section");
const locationName = document.querySelector("#location-name");
const updatedTime = document.querySelector("#updated-time");
const currentTemp = document.querySelector("#current-temp");
const currentSummary = document.querySelector("#current-summary");
const apparentTemp = document.querySelector("#apparent-temp");
const humidity = document.querySelector("#humidity");
const windSpeed = document.querySelector("#wind-speed");
const forecastGrid = document.querySelector("#forecast-grid");
const locationButton = document.querySelector("#current-location-btn");
const searchButton = searchForm?.querySelector("button[type='submit']");

const DEFAULT_SEARCH_BUTTON_TEXT = searchButton?.textContent ?? "Get Forecast";
const DEFAULT_LOCATION_BUTTON_TEXT = locationButton?.textContent?.trim() ?? "Use my location";

const WEATHER_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

const WEATHER_ICON_MAP = {
  0: "☀️",
  1: "🌤️",
  2: "🌤️",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌧️",
  53: "🌧️",
  55: "🌧️",
  56: "🌧️",
  57: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  66: "🌦️",
  67: "🌦️",
  71: "❄️",
  73: "❄️",
  75: "❄️",
  77: "❄️",
  80: "🌦️",
  81: "🌦️",
  82: "🌦️",
  85: "❄️",
  86: "❄️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

const getWeatherIcon = (code) => WEATHER_ICON_MAP[code] ?? "🌈";

const formatDate = (isoString, options = {}) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(undefined, options).format(date);
};

const formatTime24 = (isoString) => {
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const setStatus = (message, isError = false) => {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
};

const toggleLoading = (isLoading, source = "search") => {
  if (searchButton) {
    searchButton.disabled = isLoading;
    searchButton.textContent = isLoading ? "Loading..." : DEFAULT_SEARCH_BUTTON_TEXT;
  }
  if (locationButton) {
    locationButton.disabled = isLoading;
    locationButton.textContent = isLoading
      ? source === "geolocation"
        ? "Locating..."
        : DEFAULT_LOCATION_BUTTON_TEXT
      : DEFAULT_LOCATION_BUTTON_TEXT;
  }
};

const showResultSection = () => {
  resultSection.classList.remove("hidden");
  // Trigger reflow to restart animation
  void resultSection.offsetWidth;
  resultSection.style.animation = "none";
  setTimeout(() => {
    resultSection.style.animation = "";
  }, 10);
};

const hideResultSection = () => {
  resultSection.classList.add("hidden");
};

const getGeocode = async (city) => {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Failed to fetch location information.");
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("No matching location found.");
  }

  const match = data.results[0];
  return {
    latitude: match.latitude,
    longitude: match.longitude,
    name: match.name,
    country: match.country,
    admin1: match.admin1,
    timezone: match.timezone,
  };
};

const getForecast = async ({ latitude, longitude, timezone = "auto" }) => {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m");
  url.searchParams.set("hourly", "temperature_2m,weather_code");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("timezone", timezone || "auto");
  url.searchParams.set("forecast_days", "7");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Failed to fetch forecast data.");
  }

  return response.json();
};

const renderCurrentWeather = (location, forecast) => {
  const { current } = forecast;
  const locationParts = [];
  if (location.name) locationParts.push(location.name);
  if (location.admin1 && location.admin1 !== location.name) locationParts.push(location.admin1);
  if (location.country && location.country !== location.admin1) locationParts.push(location.country);

  locationName.textContent = locationParts.join(", ") || "Current location";
  updatedTime.textContent = `Updated ${formatDate(current.time, {
    hour: "numeric",
    minute: "2-digit",
    weekday: "short",
  })}`;
  currentTemp.textContent = `${Math.round(current.temperature_2m)}°`;
  currentSummary.textContent = WEATHER_CODES[current.weather_code] ?? "Weather details unavailable";
  apparentTemp.textContent = `${Math.round(current.apparent_temperature)}°`;
  humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
};

const renderForecast = (forecast) => {
  const { daily, hourly } = forecast;
  forecastGrid.innerHTML = "";

  const days = daily.time.slice(1, 6);
  days.forEach((date, index) => {
    const dayIndex = index + 1;
    const highs = Math.round(daily.temperature_2m_max[dayIndex]);
    const lows = Math.round(daily.temperature_2m_min[dayIndex]);
    const code = daily.weather_code[dayIndex];

    // Get hourly data for this day (every 3 hours: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const hourlyForDay = [];
    if (hourly && hourly.time && hourly.temperature_2m && hourly.weather_code) {
      hourly.time.forEach((timeStr, hourIndex) => {
        const hourTime = new Date(timeStr);
        if (hourTime >= dayStart && hourTime <= dayEnd) {
          // Show every 3 hours
          if (hourTime.getHours() % 3 === 0) {
            hourlyForDay.push({
              time: timeStr,
              temp: hourly.temperature_2m[hourIndex],
              code: hourly.weather_code[hourIndex],
            });
          }
        }
      });
    }

    const dayCard = document.createElement("div");
    dayCard.className = "forecast-day";
    
    let hourlyHTML = "";
    if (hourlyForDay.length > 0) {
      hourlyHTML = `
        <div class="hourly-forecast">
          <div class="hourly-title">24-Hour Report</div>
          <div class="hourly-grid">
            ${hourlyForDay.map((hour) => `
              <div class="hourly-item">
                <div class="hourly-time">${formatTime24(hour.time)}</div>
                <div class="hourly-icon">${getWeatherIcon(hour.code)}</div>
                <div class="hourly-temp">${Math.round(hour.temp)}°</div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    dayCard.innerHTML = `
      <div class="date">${formatDate(date, { weekday: "short", month: "short", day: "numeric" })}</div>
      <div class="icon">${getWeatherIcon(code)}</div>
      <div class="summary">${WEATHER_CODES[code] ?? "Forecast unavailable"}</div>
      <div class="temps">
        <span class="high">${highs}°</span>
        <span class="divider">/</span>
        <span class="low">${lows}°</span>
      </div>
      ${hourlyHTML}
    `;

    forecastGrid.append(dayCard);
  });
};

const getReverseGeocode = async (latitude, longitude) => {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/reverse");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  url.searchParams.set("count", "1");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Unable to resolve your location name.");
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    return {
      latitude,
      longitude,
      name: "Current location",
      timezone: "auto",
    };
  }

  const match = data.results[0];
  return {
    latitude,
    longitude,
    name: match.name || "Current location",
    admin1: match.admin1,
    country: match.country,
    timezone: match.timezone || "auto",
  };
};

const getCurrentPosition = (options = {}) =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

const handleSearch = async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    setStatus("Please enter a city name.", true);
    hideResultSection();
    return;
  }

  try {
    toggleLoading(true, "search");
    setStatus("Searching...", false);
    hideResultSection();

    const location = await getGeocode(city);
    setStatus(`Found ${location.name}. Loading forecast...`);

    const forecast = await getForecast(location);
    renderCurrentWeather(location, forecast);
    renderForecast(forecast);

    showResultSection();
    setStatus("");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Sorry, something went wrong.", true);
    hideResultSection();
  } finally {
    toggleLoading(false);
  }
};

const handleCurrentLocation = async () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported by your browser.", true);
    return;
  }

  try {
    toggleLoading(true, "geolocation");
    setStatus("Determining your location...");
    hideResultSection();

    const position = await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    });
    const { latitude, longitude } = position.coords;

    let location;
    try {
      location = await getReverseGeocode(latitude, longitude);
    } catch (reverseError) {
      console.warn(reverseError);
      location = {
        latitude,
        longitude,
        name: "Current location",
        timezone: "auto",
      };
    }

    setStatus(`Loading weather for ${location.name || "your location"}...`);

    const forecast = await getForecast(location);
    renderCurrentWeather(location, forecast);
    renderForecast(forecast);

    cityInput.value = location.name ?? "";
    showResultSection();
    setStatus("");
  } catch (error) {
    console.error(error);
    let message = error.message || "Unable to fetch weather for your current location.";
    if (typeof error.code === "number") {
      switch (error.code) {
        case 1:
          message = "Location permission denied. Please allow access to use this feature.";
          break;
        case 2:
          message = "Unable to determine your position. Please try again.";
          break;
        case 3:
          message = "Location request timed out. Please try again.";
          break;
        default:
          break;
      }
    }
    setStatus(message, true);
    hideResultSection();
  } finally {
    toggleLoading(false);
  }
};

searchForm.addEventListener("submit", handleSearch);
locationButton?.addEventListener("click", handleCurrentLocation);

cityInput.focus();

