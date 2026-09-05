/**
 * আবহবার্তা (AbohoBarta) - আধুনিক বাংলাদেশ আবহাওয়া পূর্বাভাস অ্যাপ্লিকেশন
 * 
 * Features:
 * - Specialized Bangladesh 8-Division & district meteorological dataset
 * - Live OpenWeatherMap API v2.5 integration (with auto Bangladesh targeting)
 * - Built-in offline/demo simulation fallback engine
 * - Dark / Light theme toggle with local storage persistence
 * - Celsius (°C) / Fahrenheit (°F) dynamic unit converter
 * - Geolocation 1-click weather detection
 * - 24-Hour hourly forecast & 5-Day extended forecast cards
 * - Real-time animated SVG weather icons & ambient theme glows
 */

// ==========================================================================
// 1. App State & Constants
// ==========================================================================
const CONFIG = {
  DEFAULT_CITY: 'Dhaka',
  STORAGE_KEYS: {
    API_KEY: 'abohobarta_api_key',
    THEME: 'abohobarta_theme',
    UNIT: 'abohobarta_unit',
    RECENT_SEARCHES: 'abohobarta_recent_searches',
    LAST_CITY: 'abohobarta_last_city'
  },
  MAX_RECENT_SEARCHES: 6,
  OPENWEATHER_BASE_URL: 'https://api.openweathermap.org/data/2.5'
};

const state = {
  currentCity: CONFIG.DEFAULT_CITY,
  unit: localStorage.getItem(CONFIG.STORAGE_KEYS.UNIT) || 'metric', // 'metric' (°C) or 'imperial' (°F)
  apiKey: localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY) || '',
  rawData: null,        // Stores raw current weather (metric)
  rawForecast: null,    // Stores raw 5-day forecast (metric)
  isDemoMode: false,
  recentSearches: JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.RECENT_SEARCHES) || '[]')
};

// ==========================================================================
// 2. High-Fidelity Bangladesh Divisions & Districts Weather Data Engine
// ==========================================================================
const DEMO_CITIES = {
  'dhaka': {
    name: 'Dhaka',
    bengali: 'ঢাকা',
    country: 'BD',
    temp: 32,
    feels_like: 37,
    temp_min: 27,
    temp_max: 34,
    humidity: 78,
    pressure: 1008,
    wind_speed: 3.6, // m/s
    wind_deg: 160,
    visibility: 7500,
    clouds: 55,
    uv: 7.5,
    weather: [{ id: 802, main: 'Clouds', description: 'scattered clouds & warm haze', icon: '03d' }],
    sunrise: Math.floor(Date.now() / 1000) - 23000,
    sunset: Math.floor(Date.now() / 1000) + 21000,
    advice: 'Tropical warmth with high relative humidity across the capital. Stay hydrated and carry an umbrella for sudden monsoon drizzle.'
  },
  'chattogram': {
    name: 'Chattogram',
    bengali: 'চট্টগ্রাম',
    country: 'BD',
    temp: 30,
    feels_like: 35,
    temp_min: 26,
    temp_max: 32,
    humidity: 84,
    pressure: 1006,
    wind_speed: 5.2,
    wind_deg: 210,
    visibility: 9000,
    clouds: 65,
    uv: 6.8,
    weather: [{ id: 500, main: 'Rain', description: 'coastal passing shower', icon: '10d' }],
    sunrise: Math.floor(Date.now() / 1000) - 23500,
    sunset: Math.floor(Date.now() / 1000) + 20500,
    advice: 'Strong maritime breeze from the Bay of Bengal with intermittent light rain. Pleasant coastal evening expected.'
  },
  'chittagong': {
    name: 'Chattogram',
    bengali: 'চট্টগ্রাম',
    country: 'BD',
    temp: 30,
    feels_like: 35,
    temp_min: 26,
    temp_max: 32,
    humidity: 84,
    pressure: 1006,
    wind_speed: 5.2,
    wind_deg: 210,
    visibility: 9000,
    clouds: 65,
    uv: 6.8,
    weather: [{ id: 500, main: 'Rain', description: 'coastal passing shower', icon: '10d' }],
    sunrise: Math.floor(Date.now() / 1000) - 23500,
    sunset: Math.floor(Date.now() / 1000) + 20500,
    advice: 'Strong maritime breeze from the Bay of Bengal with intermittent light rain. Pleasant coastal evening expected.'
  },
  'sylhet': {
    name: 'Sylhet',
    bengali: 'সিলেট',
    country: 'BD',
    temp: 28,
    feels_like: 32,
    temp_min: 24,
    temp_max: 30,
    humidity: 88,
    pressure: 1005,
    wind_speed: 3.1,
    wind_deg: 90,
    visibility: 8500,
    clouds: 80,
    uv: 5.2,
    weather: [{ id: 501, main: 'Rain', description: 'moderate hilly rain', icon: '10d' }],
    sunrise: Math.floor(Date.now() / 1000) - 24000,
    sunset: Math.floor(Date.now() / 1000) + 20000,
    advice: 'Frequent mountain rain showers across Surma valley tea estates. Fresh cool breeze and lush conditions.'
  },
  'rajshahi': {
    name: 'Rajshahi',
    bengali: 'রাজশাহী',
    country: 'BD',
    temp: 34,
    feels_like: 38,
    temp_min: 26,
    temp_max: 36,
    humidity: 62,
    pressure: 1009,
    wind_speed: 3.8,
    wind_deg: 280,
    visibility: 10000,
    clouds: 20,
    uv: 8.5,
    weather: [{ id: 800, main: 'Clear', description: 'sunny & warm Padma breeze', icon: '01d' }],
    sunrise: Math.floor(Date.now() / 1000) - 22500,
    sunset: Math.floor(Date.now() / 1000) + 21500,
    advice: 'Bright sunshine with elevated temperatures along the Padma riverbank. High UV index; sun protection advised.'
  },
  'khulna': {
    name: 'Khulna',
    bengali: 'খুলনা',
    country: 'BD',
    temp: 31,
    feels_like: 36,
    temp_min: 26,
    temp_max: 33,
    humidity: 80,
    pressure: 1007,
    wind_speed: 4.4,
    wind_deg: 170,
    visibility: 9000,
    clouds: 45,
    uv: 7.0,
    weather: [{ id: 801, main: 'Clouds', description: 'few clouds & humid river breeze', icon: '02d' }],
    sunrise: Math.floor(Date.now() / 1000) - 23000,
    sunset: Math.floor(Date.now() / 1000) + 21000,
    advice: 'Sundarbans delta influence bringing humid tropical air and gentle southern river winds.'
  },
  'barishal': {
    name: 'Barishal',
    bengali: 'বরিশাল',
    country: 'BD',
    temp: 30,
    feels_like: 35,
    temp_min: 25,
    temp_max: 32,
    humidity: 85,
    pressure: 1007,
    wind_speed: 4.8,
    wind_deg: 180,
    visibility: 8500,
    clouds: 60,
    uv: 6.5,
    weather: [{ id: 500, main: 'Rain', description: 'light passing river rain', icon: '10d' }],
    sunrise: Math.floor(Date.now() / 1000) - 23200,
    sunset: Math.floor(Date.now() / 1000) + 20800,
    advice: 'Riverine waterways seeing overcast skies and brief scattered rainfall. Great conditions for river travel.'
  },
  'barisal': {
    name: 'Barishal',
    bengali: 'বরিশাল',
    country: 'BD',
    temp: 30,
    feels_like: 35,
    temp_min: 25,
    temp_max: 32,
    humidity: 85,
    pressure: 1007,
    wind_speed: 4.8,
    wind_deg: 180,
    visibility: 8500,
    clouds: 60,
    uv: 6.5,
    weather: [{ id: 500, main: 'Rain', description: 'light passing river rain', icon: '10d' }],
    sunrise: Math.floor(Date.now() / 1000) - 23200,
    sunset: Math.floor(Date.now() / 1000) + 20800,
    advice: 'Riverine waterways seeing overcast skies and brief scattered rainfall. Great conditions for river travel.'
  },
  'rangpur': {
    name: 'Rangpur',
    bengali: 'রংপুর',
    country: 'BD',
    temp: 29,
    feels_like: 33,
    temp_min: 24,
    temp_max: 31,
    humidity: 75,
    pressure: 1010,
    wind_speed: 3.2,
    wind_deg: 70,
    visibility: 9500,
    clouds: 35,
    uv: 7.2,
    weather: [{ id: 801, main: 'Clouds', description: 'mild sunshine & Teesta valley breeze', icon: '02d' }],
    sunrise: Math.floor(Date.now() / 1000) - 23000,
    sunset: Math.floor(Date.now() / 1000) + 21000,
    advice: 'Pleasant northern climate with gentle agricultural breezes and moderate humidity.'
  },
  'mymensingh': {
    name: 'Mymensingh',
    bengali: 'ময়মনসিংহ',
    country: 'BD',
    temp: 30,
    feels_like: 34,
    temp_min: 25,
    temp_max: 32,
    humidity: 80,
    pressure: 1008,
    wind_speed: 3.0,
    wind_deg: 120,
    visibility: 9000,
    clouds: 50,
    uv: 6.9,
    weather: [{ id: 802, main: 'Clouds', description: 'scattered clouds along Brahmaputra', icon: '03d' }],
    sunrise: Math.floor(Date.now() / 1000) - 23200,
    sunset: Math.floor(Date.now() / 1000) + 20800,
    advice: 'Comfortable floodplain weather along Old Brahmaputra river with scattered fluffy cumulus clouds.'
  },
  "cox's bazar": {
    name: "Cox's Bazar",
    bengali: 'কক্সবাজার',
    country: 'BD',
    temp: 29,
    feels_like: 34,
    temp_min: 26,
    temp_max: 31,
    humidity: 88,
    pressure: 1006,
    wind_speed: 6.5,
    wind_deg: 220,
    visibility: 10000,
    clouds: 60,
    uv: 7.2,
    weather: [{ id: 500, main: 'Rain', description: 'breezy sea shower', icon: '10d' }],
    sunrise: Math.floor(Date.now() / 1000) - 23800,
    sunset: Math.floor(Date.now() / 1000) + 20200,
    advice: 'Refreshing sea breeze with rolling waves and occasional passing beach drizzle. Excellent for seaside walks.'
  },
  'coxsbazar': {
    name: "Cox's Bazar",
    bengali: 'কক্সবাজার',
    country: 'BD',
    temp: 29,
    feels_like: 34,
    temp_min: 26,
    temp_max: 31,
    humidity: 88,
    pressure: 1006,
    wind_speed: 6.5,
    wind_deg: 220,
    visibility: 10000,
    clouds: 60,
    uv: 7.2,
    weather: [{ id: 500, main: 'Rain', description: 'breezy sea shower', icon: '10d' }],
    sunrise: Math.floor(Date.now() / 1000) - 23800,
    sunset: Math.floor(Date.now() / 1000) + 20200,
    advice: 'Refreshing sea breeze with rolling waves and occasional passing beach drizzle. Excellent for seaside walks.'
  },
  'gazipur': {
    name: 'Gazipur',
    bengali: 'গাজীপুর',
    country: 'BD',
    temp: 32,
    feels_like: 36,
    temp_min: 26,
    temp_max: 33,
    humidity: 76,
    pressure: 1008,
    wind_speed: 3.4,
    wind_deg: 150,
    visibility: 8000,
    clouds: 50,
    uv: 7.3,
    weather: [{ id: 802, main: 'Clouds', description: 'scattered clouds', icon: '03d' }],
    sunrise: Math.floor(Date.now() / 1000) - 23000,
    sunset: Math.floor(Date.now() / 1000) + 21000,
    advice: 'Warm industrial corridor with hazy cloud cover. Keep windows ventilated.'
  },
  'cumilla': {
    name: 'Cumilla',
    bengali: 'কুমিল্লা',
    country: 'BD',
    temp: 31,
    feels_like: 35,
    temp_min: 25,
    temp_max: 33,
    humidity: 81,
    pressure: 1007,
    wind_speed: 3.9,
    wind_deg: 140,
    visibility: 9000,
    clouds: 40,
    uv: 7.1,
    weather: [{ id: 801, main: 'Clouds', description: 'partly cloudy near Mainamati', icon: '02d' }],
    sunrise: Math.floor(Date.now() / 1000) - 23300,
    sunset: Math.floor(Date.now() / 1000) + 20700,
    advice: 'Pleasant eastern plains weather with mild southeasterly breeze.'
  }
};

/**
 * Generates realistic 5-day / 3-hour forecast for Bangladesh cities
 */
function generateDemoForecast(baseCity) {
  const list = [];
  const now = Math.floor(Date.now() / 1000);
  const conditions = [
    { id: 802, main: 'Clouds', description: 'scattered clouds', icon: '03d' },
    { id: 500, main: 'Rain', description: 'monsoon drizzle', icon: '10d' },
    { id: 800, main: 'Clear', description: 'sunny sky', icon: '01d' },
    { id: 803, main: 'Clouds', description: 'broken clouds', icon: '04d' },
    { id: 501, main: 'Rain', description: 'passing rain shower', icon: '10d' }
  ];

  // 40 forecast segments (5 days * 8 three-hour intervals)
  for (let i = 0; i < 40; i++) {
    const timestamp = now + i * 3 * 3600;
    const dayIndex = Math.floor(i / 8) % conditions.length;
    const hourOffset = (i % 8);
    
    // Day/Night temperature fluctuation curve (tropical diurnal range ~6°C)
    const diurnalCurve = Math.sin((hourOffset - 2) * (Math.PI / 4));
    const temp = Math.round(baseCity.temp + diurnalCurve * 3.5 + (Math.random() * 1.5 - 0.75));
    const cond = conditions[(dayIndex + (i % 2 === 0 ? 0 : 1)) % conditions.length];

    list.push({
      dt: timestamp,
      main: {
        temp: temp,
        feels_like: temp + 4,
        temp_min: temp - 2,
        temp_max: temp + 2,
        humidity: Math.min(96, Math.max(55, baseCity.humidity + Math.round(diurnalCurve * -8))),
        pressure: baseCity.pressure + Math.round(diurnalCurve * 2)
      },
      weather: [{
        id: cond.id,
        main: cond.main,
        description: cond.description,
        icon: (hourOffset >= 2 && hourOffset <= 6) ? cond.icon.replace('n', 'd') : cond.icon.replace('d', 'n')
      }],
      clouds: { all: baseCity.clouds },
      wind: { speed: baseCity.wind_speed, deg: baseCity.wind_deg },
      pop: cond.main === 'Rain' ? 0.7 : 0.15
    });
  }

  return { list, city: { name: baseCity.name, country: baseCity.country } };
}

// ==========================================================================
// 3. UI Elements References
// ==========================================================================
const DOM = {
  // Search & Navigation
  searchForm: document.getElementById('searchForm'),
  cityInput: document.getElementById('cityInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  locationBtn: document.getElementById('locationBtn'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  unitCelsius: document.getElementById('unitCelsius'),
  unitFahrenheit: document.getElementById('unitFahrenheit'),
  settingsModalBtn: document.getElementById('settingsModalBtn'),
  
  // Ambient & Decor
  ambientGlow: document.getElementById('ambientGlow'),
  statusBanner: document.getElementById('statusBanner'),
  statusBannerText: document.getElementById('statusBannerText'),
  statusBannerClose: document.getElementById('statusBannerClose'),
  quickCitiesTrack: document.getElementById('quickCitiesTrack'),
  recentSearchesContainer: document.getElementById('recentSearchesContainer'),
  recentChips: document.getElementById('recentChips'),

  // Hero Card
  heroCard: document.getElementById('heroCard'),
  cityName: document.getElementById('cityName'),
  countryBadge: document.getElementById('countryBadge'),
  currentDateTime: document.getElementById('currentDateTime'),
  conditionBadge: document.getElementById('conditionBadge'),
  conditionText: document.getElementById('conditionText'),
  heroWeatherIcon: document.getElementById('heroWeatherIcon'),
  currentTemp: document.getElementById('currentTemp'),
  tempUnitSymbol: document.getElementById('tempUnitSymbol'),
  feelsLikeTemp: document.getElementById('feelsLikeTemp'),
  heroTempMax: document.getElementById('heroTempMax'),
  heroTempMin: document.getElementById('heroTempMin'),
  weatherDescriptionSentence: document.getElementById('weatherDescriptionSentence'),

  // Metrics Grid
  humidityVal: document.getElementById('humidityVal'),
  humidityBar: document.getElementById('humidityBar'),
  humidityStatus: document.getElementById('humidityStatus'),
  windSpeedVal: document.getElementById('windSpeedVal'),
  windSpeedUnit: document.getElementById('windSpeedUnit'),
  compassPointer: document.getElementById('compassPointer'),
  windDirText: document.getElementById('windDirText'),
  pressureVal: document.getElementById('pressureVal'),
  pressureStatus: document.getElementById('pressureStatus'),
  visibilityVal: document.getElementById('visibilityVal'),
  visibilityUnit: document.getElementById('visibilityUnit'),
  visibilityStatus: document.getElementById('visibilityStatus'),
  uvVal: document.getElementById('uvVal'),
  uvBar: document.getElementById('uvBar'),
  uvStatus: document.getElementById('uvStatus'),
  cloudCoverVal: document.getElementById('cloudCoverVal'),
  cloudCoverBar: document.getElementById('cloudCoverBar'),
  cloudCoverStatus: document.getElementById('cloudCoverStatus'),
  sunriseTime: document.getElementById('sunriseTime'),
  sunriseCountdown: document.getElementById('sunriseCountdown'),
  sunsetTime: document.getElementById('sunsetTime'),
  sunsetCountdown: document.getElementById('sunsetCountdown'),
  lastUpdatedTime: document.getElementById('lastUpdatedTime'),

  // Hourly & 5-Day Forecast
  hourlyForecastTrack: document.getElementById('hourlyForecastTrack'),
  hourlySlideLeft: document.getElementById('hourlySlideLeft'),
  hourlySlideRight: document.getElementById('hourlySlideRight'),
  forecastCardsList: document.getElementById('forecastCardsList'),
  weatherAdviceText: document.getElementById('weatherAdviceText'),

  // Modals & Overlays
  loadingOverlay: document.getElementById('loadingOverlay'),
  errorModal: document.getElementById('errorModal'),
  errorModalTitle: document.getElementById('errorModalTitle'),
  errorModalMsg: document.getElementById('errorModalMsg'),
  errorModalCloseBtn: document.getElementById('errorModalCloseBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  apiSettingsForm: document.getElementById('apiSettingsForm'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  toggleKeyVisibilityBtn: document.getElementById('toggleKeyVisibilityBtn'),
  toggleKeyIcon: document.getElementById('toggleKeyIcon'),
  apiKeyStatusBox: document.getElementById('apiKeyStatusBox'),
  apiStatusIndicator: document.getElementById('apiStatusIndicator'),
  apiStatusText: document.getElementById('apiStatusText'),
  clearApiKeyBtn: document.getElementById('clearApiKeyBtn'),
  toastContainer: document.getElementById('toastContainer')
};

// ==========================================================================
// 4. Weather Icon & Condition Mapping
// ==========================================================================
function getWeatherVisuals(weatherId, iconCode) {
  const isNight = iconCode ? iconCode.includes('n') : false;
  
  // Thunderstorm
  if (weatherId >= 200 && weatherId < 300) {
    return {
      icon: 'cloud-lightning',
      ambientClass: 'thunder',
      label: 'Kalbaishakhi / Storm'
    };
  }
  // Drizzle
  if (weatherId >= 300 && weatherId < 400) {
    return {
      icon: 'cloud-drizzle',
      ambientClass: 'rainy',
      label: 'Light Drizzle'
    };
  }
  // Rain
  if (weatherId >= 500 && weatherId < 600) {
    return {
      icon: 'cloud-rain',
      ambientClass: 'rainy',
      label: 'Monsoon Rain'
    };
  }
  // Snow
  if (weatherId >= 600 && weatherId < 700) {
    return {
      icon: 'snowflake',
      ambientClass: 'snowy',
      label: 'Frost'
    };
  }
  // Atmosphere (Mist, Smoke, Haze, Dust, Fog)
  if (weatherId >= 700 && weatherId < 800) {
    return {
      icon: 'cloud-fog',
      ambientClass: 'mist',
      label: 'Haze / Mist'
    };
  }
  // Clear Sky
  if (weatherId === 800) {
    return {
      icon: isNight ? 'moon' : 'sun',
      ambientClass: isNight ? 'clouds' : 'sunny',
      label: isNight ? 'Clear Night' : 'Sunny & Bright'
    };
  }
  // Few / Scattered Clouds
  if (weatherId === 801 || weatherId === 802) {
    return {
      icon: isNight ? 'cloud-moon' : 'cloud-sun',
      ambientClass: 'clouds',
      label: 'Partly Cloudy'
    };
  }
  // Broken / Overcast Clouds
  if (weatherId >= 803) {
    return {
      icon: 'cloud',
      ambientClass: 'clouds',
      label: 'Overcast Skies'
    };
  }

  return { icon: 'cloud-sun', ambientClass: 'clouds', label: 'Partly Cloudy' };
}

// ==========================================================================
// 5. Unit Conversion Helpers
// ==========================================================================
function formatTemp(celsius) {
  if (state.unit === 'imperial') {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

function formatWindSpeed(speedMps) {
  if (state.unit === 'imperial') {
    return (speedMps * 2.23694).toFixed(1);
  }
  return (speedMps * 3.6).toFixed(1);
}

function getWindUnitText() {
  return state.unit === 'imperial' ? 'mph' : 'km/h';
}

function formatVisibility(meters) {
  if (state.unit === 'imperial') {
    return (meters / 1609.34).toFixed(1);
  }
  return (meters / 1000).toFixed(1);
}

function getVisibilityUnitText() {
  return state.unit === 'imperial' ? 'mi' : 'km';
}

function getWindDirection(deg) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((deg % 360) / 22.5);
  return directions[index % 16];
}

function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
}

function cleanCityQuery(str) {
  if (!str) return '';
  // Strip parentheses and Bengali script for clean API querying e.g. "Dhaka (ঢাকা)" -> "Dhaka"
  return str.replace(/\s*\(.*?\)\s*/g, '').trim();
}

function capitalizeWords(str) {
  if (!str) return '';
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

// ==========================================================================
// 6. Weather Rendering & UI Update Engine
// ==========================================================================
function renderAllWeather() {
  if (!state.rawData || !state.rawForecast) return;

  const current = state.rawData;
  const forecast = state.rawForecast;

  // 1. Update Unit Label Indicators
  DOM.tempUnitSymbol.textContent = state.unit === 'imperial' ? '°F' : '°C';
  DOM.windSpeedUnit.textContent = getWindUnitText();
  DOM.visibilityUnit.textContent = getVisibilityUnitText();

  // 2. Render Hero Card
  DOM.cityName.textContent = current.name;
  DOM.countryBadge.textContent = current.sys ? current.sys.country : (current.country || 'BD');
  
  const now = new Date();
  DOM.currentDateTime.textContent = `${formatDate(now.getTime() / 1000)} • ${formatTime(now.getTime() / 1000)}`;
  
  const weatherObj = (current.weather && current.weather[0]) ? current.weather[0] : { id: 800, icon: '01d', description: 'Clear' };
  const visuals = getWeatherVisuals(weatherObj.id, weatherObj.icon);

  // Set ambient background glow
  DOM.ambientGlow.className = `ambient-glow ${visuals.ambientClass}`;

  // Condition Badge
  DOM.conditionText.textContent = capitalizeWords(weatherObj.description);

  // Dynamic SVG Hero Icon
  DOM.heroWeatherIcon.innerHTML = `<i data-lucide="${visuals.icon}" class="weather-hero-svg"></i>`;

  // Main Temperature and Feels Like
  DOM.currentTemp.textContent = formatTemp(current.main.temp);
  DOM.feelsLikeTemp.textContent = `${formatTemp(current.main.feels_like)}°${state.unit === 'imperial' ? 'F' : 'C'}`;

  // Min / Max Day Temperature
  DOM.heroTempMax.textContent = `${formatTemp(current.main.temp_max)}°${state.unit === 'imperial' ? 'F' : 'C'}`;
  DOM.heroTempMin.textContent = `${formatTemp(current.main.temp_min)}°${state.unit === 'imperial' ? 'F' : 'C'}`;

  // Summary sentence
  const summarySentences = {
    'clear': 'Warm sunshine with clear visibility across the district.',
    'clouds': 'Partly cloudy to overcast skies with typical tropical humidity.',
    'rain': 'Monsoon rains and showers observed. Carry an umbrella when stepping out.',
    'thunder': 'Kalbaishakhi/thunderstorm activity. Stay in safe indoor shelter.',
    'snow': 'Cool breeze and misty morning atmosphere across the northern zone.',
    'mist': 'Morning haze and river mist. Drive with caution along highways and waterways.'
  };
  DOM.weatherDescriptionSentence.textContent = summarySentences[visuals.ambientClass] || 'Current atmospheric conditions observed across Bangladesh.';

  // 3. Render Metrics Grid
  // Humidity
  DOM.humidityVal.textContent = current.main.humidity;
  DOM.humidityBar.style.width = `${Math.min(100, current.main.humidity)}%`;
  if (current.main.humidity < 50) {
    DOM.humidityStatus.textContent = 'Pleasantly Dry';
  } else if (current.main.humidity <= 75) {
    DOM.humidityStatus.textContent = 'Moderate Humidity';
  } else {
    DOM.humidityStatus.textContent = 'Tropical / Humid';
  }

  // Wind Speed & Compass
  const windSpeedMps = current.wind ? (current.wind.speed || 0) : 0;
  const windDeg = current.wind ? (current.wind.deg || 0) : 0;
  DOM.windSpeedVal.textContent = formatWindSpeed(windSpeedMps);
  DOM.compassPointer.style.transform = `rotate(${windDeg}deg)`;
  DOM.windDirText.textContent = `${getWindDirection(windDeg)} (${windDeg}°)`;

  // Pressure
  DOM.pressureVal.textContent = current.main.pressure;
  DOM.pressureStatus.textContent = current.main.pressure > 1010 ? 'High Pressure' : 'Monsoon Low / Normal';

  // Visibility
  const visMeters = current.visibility || 10000;
  DOM.visibilityVal.textContent = formatVisibility(visMeters);
  DOM.visibilityStatus.textContent = visMeters >= 9000 ? 'Crystal Clear' : (visMeters >= 4000 ? 'Mild Haze' : 'River Fog / Mist');

  // UV Index
  const uvVal = current.uv || (weatherObj.id === 800 ? 8.2 : (weatherObj.id >= 801 && weatherObj.id <= 803 ? 6.5 : 3.0));
  DOM.uvVal.textContent = uvVal.toFixed(1);
  DOM.uvBar.style.width = `${Math.min(100, (uvVal / 11) * 100)}%`;
  if (uvVal <= 2) DOM.uvStatus.textContent = 'Low (Safe)';
  else if (uvVal <= 5) DOM.uvStatus.textContent = 'Moderate';
  else if (uvVal <= 7) DOM.uvStatus.textContent = 'High (Sun Protection)';
  else DOM.uvStatus.textContent = 'Very High / Tropical Sun';

  // Cloud Cover
  const cloudCover = current.clouds ? current.clouds.all : 0;
  DOM.cloudCoverVal.textContent = cloudCover;
  DOM.cloudCoverBar.style.width = `${cloudCover}%`;
  DOM.cloudCoverStatus.textContent = cloudCover < 20 ? 'Clear Skies' : (cloudCover < 60 ? 'Scattered Clouds' : 'Overcast Monsoon');

  // Sunrise & Sunset
  const sunriseTs = current.sys ? current.sys.sunrise : current.sunrise;
  const sunsetTs = current.sys ? current.sys.sunset : current.sunset;
  if (sunriseTs && sunsetTs) {
    DOM.sunriseTime.textContent = formatTime(sunriseTs);
    DOM.sunsetTime.textContent = formatTime(sunsetTs);
    
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec < sunriseTs) {
      const hoursToDawn = ((sunriseTs - nowSec) / 3600).toFixed(1);
      DOM.sunriseCountdown.textContent = `Dawn in ~${hoursToDawn} hrs`;
    } else {
      DOM.sunriseCountdown.textContent = `Dawn completed`;
    }

    if (nowSec < sunsetTs && nowSec >= sunriseTs) {
      const hoursToDusk = ((sunsetTs - nowSec) / 3600).toFixed(1);
      DOM.sunsetCountdown.textContent = `Dusk in ~${hoursToDusk} hrs`;
    } else {
      DOM.sunsetCountdown.textContent = `Nightfall active`;
    }
  }

  DOM.lastUpdatedTime.textContent = `Updated at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  // 4. Render 24-Hour Hourly Forecast
  renderHourlyForecast(forecast.list.slice(0, 10));

  // 5. Render 5-Day Extended Forecast
  render5DayForecast(forecast.list);

  // 6. Render Weather Advice Box
  if (current.advice) {
    DOM.weatherAdviceText.textContent = current.advice;
  } else {
    DOM.weatherAdviceText.textContent = generateWeatherAdvice(current);
  }

  // Refresh dynamic Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Generates dynamic smart lifestyle/health advice based on Bangladesh weather
 */
function generateWeatherAdvice(current) {
  const tempC = current.main.temp;
  const weatherId = (current.weather && current.weather[0]) ? current.weather[0].id : 800;
  const humidity = current.main.humidity;

  if (weatherId >= 200 && weatherId < 600) {
    return 'Monsoon rains active. Carry a raincoat or umbrella, beware of waterlogging in urban streets, and drive safely.';
  }
  if (tempC >= 35) {
    return 'Severe heat & high humidity alert across the division. Keep hydrated with pure water, coconut water, or saline.';
  }
  if (tempC >= 30 && humidity > 75) {
    return 'Warm & humid tropical day. Wear light, breathable cotton clothes and avoid prolonged direct afternoon sunlight.';
  }
  if (tempC < 15) {
    return 'Cool winter morning/evening. Wear light sweaters or shawls when traveling along rivers or northern highways.';
  }
  return 'Comfortable weather across the region. Perfect for family outings, travel, and daily outdoor activities.';
}

/**
 * Renders the 24-Hour Hourly Forecast Cards Slider
 */
function renderHourlyForecast(hourlyItems) {
  DOM.hourlyForecastTrack.innerHTML = '';

  hourlyItems.forEach((item, index) => {
    const time = index === 0 ? 'Now' : formatTime(item.dt);
    const weatherObj = item.weather[0] || { id: 800, icon: '01d' };
    const visuals = getWeatherVisuals(weatherObj.id, weatherObj.icon);
    const temp = formatTemp(item.main.temp);
    const pop = Math.round((item.pop || 0) * 100);

    const card = document.createElement('div');
    card.className = `hourly-card ${index === 0 ? 'active-hour' : ''}`;
    card.innerHTML = `
      <span class="hourly-time">${time}</span>
      <div class="hourly-icon-box">
        <i data-lucide="${visuals.icon}"></i>
      </div>
      <span class="hourly-temp">${temp}°</span>
      ${pop > 10 ? `<span class="hourly-pop"><i data-lucide="droplet"></i> ${pop}%</span>` : `<span class="hourly-pop" style="opacity: 0;">0%</span>`}
    `;
    DOM.hourlyForecastTrack.appendChild(card);
  });
}

/**
 * Renders the 5-Day Forecast with visual temperature range bars
 */
function render5DayForecast(forecastList) {
  DOM.forecastCardsList.innerHTML = '';

  // Group 3-hour forecast chunks by day
  const dailyBuckets = {};
  forecastList.forEach(item => {
    const dateKey = new Date(item.dt * 1000).toISOString().split('T')[0];
    if (!dailyBuckets[dateKey]) {
      dailyBuckets[dateKey] = [];
    }
    dailyBuckets[dateKey].push(item);
  });

  const dayKeys = Object.keys(dailyBuckets).slice(0, 5);
  
  // Find global min and max among all 5 days for the relative percentage temperature bar
  let globalMin = Infinity;
  let globalMax = -Infinity;

  const aggregatedDays = dayKeys.map((key, index) => {
    const items = dailyBuckets[key];
    let min = Infinity;
    let max = -Infinity;
    let dominantWeather = items[0].weather[0];

    items.forEach(it => {
      if (it.main.temp_min < min) min = it.main.temp_min;
      if (it.main.temp_max > max) max = it.main.temp_max;
      
      const hour = new Date(it.dt * 1000).getHours();
      if (hour >= 11 && hour <= 15) {
        dominantWeather = it.weather[0];
      }
    });

    if (min < globalMin) globalMin = min;
    if (max > globalMax) globalMax = max;

    const dateObj = new Date(items[0].dt * 1000);
    const dayName = index === 0 ? 'Today' : (index === 1 ? 'Tomorrow' : dateObj.toLocaleDateString([], { weekday: 'short' }));
    const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

    return {
      dayName,
      formattedDate,
      min,
      max,
      weather: dominantWeather
    };
  });

  // Render cards
  const tempSpan = Math.max(1, globalMax - globalMin);

  aggregatedDays.forEach(day => {
    const visuals = getWeatherVisuals(day.weather.id, day.weather.icon);
    const minFormatted = formatTemp(day.min);
    const maxFormatted = formatTemp(day.max);

    // Calculate relative percentage for visual range bar
    const leftPercent = Math.max(0, Math.min(100, ((day.min - globalMin) / tempSpan) * 100));
    const widthPercent = Math.max(15, Math.min(100 - leftPercent, ((day.max - day.min) / tempSpan) * 100));

    const card = document.createElement('div');
    card.className = 'forecast-day-card';
    card.innerHTML = `
      <div class="day-name-col">
        <span class="day-title">${day.dayName}</span>
        <span class="day-date">${day.formattedDate}</span>
      </div>
      <div class="day-icon-col">
        <i data-lucide="${visuals.icon}"></i>
      </div>
      <div class="day-desc-col">${capitalizeWords(day.weather.description)}</div>
      <div class="temp-bar-col">
        <span class="temp-low">${minFormatted}°</span>
        <div class="temp-range-bar">
          <div class="temp-range-fill" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
        </div>
        <span class="temp-high">${maxFormatted}°</span>
      </div>
    `;
    DOM.forecastCardsList.appendChild(card);
  });
}

// ==========================================================================
// 7. API Fetching & Network Handlers
// ==========================================================================
async function fetchWeatherByCity(cityName) {
  showLoading(true);
  try {
    const cleaned = cleanCityQuery(cityName);
    if (!cleaned) return;

    // Check if user provided an OpenWeather API key
    if (state.apiKey) {
      try {
        // Query city with BD country code priority if no country specified
        const queryWithCountry = cleaned.includes(',') ? cleaned : `${cleaned},BD`;
        const weatherRes = await fetch(`${CONFIG.OPENWEATHER_BASE_URL}/weather?q=${encodeURIComponent(queryWithCountry)}&units=metric&appid=${state.apiKey}`);
        
        if (weatherRes.status === 401) {
          throw new Error('API_KEY_INVALID');
        }
        if (weatherRes.status === 404) {
          // Fallback retry without BD code if user searched global city
          const fallbackRes = await fetch(`${CONFIG.OPENWEATHER_BASE_URL}/weather?q=${encodeURIComponent(cleaned)}&units=metric&appid=${state.apiKey}`);
          if (!fallbackRes.ok) throw new Error('CITY_NOT_FOUND');
          return handleSuccessfulFetch(await fallbackRes.json(), cleaned);
        }
        if (!weatherRes.ok) {
          throw new Error('NETWORK_ERROR');
        }

        const weatherData = await weatherRes.json();
        return handleSuccessfulFetch(weatherData, cleaned);
      } catch (err) {
        if (err.message === 'CITY_NOT_FOUND') {
          showErrorModal('Location Not Found', `We couldn't locate weather details for "${cleaned}". Please check the spelling of the district or city.`);
          return;
        } else if (err.message === 'API_KEY_INVALID') {
          showToast('Invalid API key. Using Bangladesh simulation.', 'error');
        } else {
          console.warn('API issue, falling back to Bangladesh simulation:', err);
          showToast('API issue encountered. Displaying Bangladesh simulation.', 'info');
        }
      }
    }

    // Demo / Smart Bangladesh Fallback Mode Engine
    loadDemoCityData(cleaned);

  } catch (error) {
    console.error('Fatal Weather Fetch Error:', error);
    showErrorModal('Weather Fetch Error', 'Unable to retrieve weather data. Please check your connection.');
  } finally {
    showLoading(false);
  }
}

async function handleSuccessfulFetch(weatherData, originalQuery) {
  const forecastRes = await fetch(`${CONFIG.OPENWEATHER_BASE_URL}/forecast?q=${encodeURIComponent(weatherData.name)},${weatherData.sys ? weatherData.sys.country : 'BD'}&units=metric&appid=${state.apiKey}`);
  let forecastData;
  if (forecastRes.ok) {
    forecastData = await forecastRes.json();
  } else {
    // Generate fallback forecast if 5-day endpoint fails
    forecastData = generateDemoForecast({
      name: weatherData.name,
      country: weatherData.sys ? weatherData.sys.country : 'BD',
      temp: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      clouds: weatherData.clouds ? weatherData.clouds.all : 30,
      pressure: weatherData.main.pressure,
      wind_speed: weatherData.wind ? weatherData.wind.speed : 3.5,
      wind_deg: weatherData.wind ? weatherData.wind.deg : 180
    });
  }

  state.rawData = weatherData;
  state.rawForecast = forecastData;
  state.currentCity = weatherData.name;
  state.isDemoMode = false;
  
  saveRecentSearch(weatherData.name);
  hideStatusBanner();
  renderAllWeather();
  showToast(`Live weather updated for ${weatherData.name}`, 'success');
}

/**
 * Fetch weather by geographic coordinates (Geolocation)
 */
async function fetchWeatherByCoords(lat, lon) {
  showLoading(true);
  try {
    if (state.apiKey) {
      try {
        const weatherRes = await fetch(`${CONFIG.OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${state.apiKey}`);
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          const forecastRes = await fetch(`${CONFIG.OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${state.apiKey}`);
          const forecastData = await forecastRes.json();

          state.rawData = weatherData;
          state.rawForecast = forecastData;
          state.currentCity = weatherData.name;
          state.isDemoMode = false;
          
          saveRecentSearch(weatherData.name);
          hideStatusBanner();
          renderAllWeather();
          showToast(`Location detected: ${weatherData.name}`, 'success');
          return;
        }
      } catch (e) {
        console.warn('Coords API fetch failed, falling back to demo simulation', e);
      }
    }

    // Default to Dhaka demo for coordinates if no API key
    loadDemoCityData('Dhaka');
    showToast('Location identified in Bangladesh. Running in demo mode.', 'info');
  } finally {
    showLoading(false);
  }
}

/**
 * Loads or generates synthetic high-fidelity city data for Bangladesh
 */
function loadDemoCityData(query) {
  const normalized = query.toLowerCase().trim();
  let baseData = DEMO_CITIES[normalized];

  if (!baseData) {
    // Generate dynamic mock for any unrecognized district/city in Bangladesh
    baseData = {
      name: capitalizeWords(query),
      bengali: '',
      country: 'BD',
      temp: 30 + Math.floor(Math.random() * 5) - 2,
      feels_like: 35,
      temp_min: 25,
      temp_max: 33,
      humidity: 75 + Math.floor(Math.random() * 15),
      pressure: 1008 + Math.floor(Math.random() * 4),
      wind_speed: 3.5 + Math.random() * 2,
      wind_deg: Math.floor(Math.random() * 360),
      visibility: 9000,
      clouds: 45,
      uv: 7.0,
      weather: [{ id: 801, main: 'Clouds', description: 'partly cloudy & warm', icon: '02d' }],
      sunrise: Math.floor(Date.now() / 1000) - 23000,
      sunset: Math.floor(Date.now() / 1000) + 21000,
      advice: 'Warm tropical conditions observed across the district. Carry water and sun protection when outdoors.'
    };
  }

  state.rawData = {
    name: baseData.name,
    country: baseData.country,
    main: {
      temp: baseData.temp,
      feels_like: baseData.feels_like,
      temp_min: baseData.temp_min,
      temp_max: baseData.temp_max,
      humidity: baseData.humidity,
      pressure: baseData.pressure
    },
    wind: {
      speed: baseData.wind_speed,
      deg: baseData.wind_deg
    },
    visibility: baseData.visibility,
    clouds: { all: baseData.clouds },
    uv: baseData.uv,
    weather: baseData.weather,
    sys: {
      country: baseData.country,
      sunrise: baseData.sunrise,
      sunset: baseData.sunset
    },
    advice: baseData.advice
  };

  state.rawForecast = generateDemoForecast(baseData);
  state.currentCity = baseData.name;
  state.isDemoMode = true;

  saveRecentSearch(baseData.name);
  showStatusBanner('Displaying Bangladesh live forecast simulation. Enter your OpenWeather key in Settings for live sensor feeds.');
  renderAllWeather();
}

// ==========================================================================
// 8. Recent Searches & Quick City Shortcuts
// ==========================================================================
function saveRecentSearch(cityName) {
  if (!cityName) return;
  const name = cleanCityQuery(cityName);
  state.recentSearches = state.recentSearches.filter(c => c.toLowerCase() !== name.toLowerCase());
  state.recentSearches.unshift(name);
  if (state.recentSearches.length > CONFIG.MAX_RECENT_SEARCHES) {
    state.recentSearches.pop();
  }
  localStorage.setItem(CONFIG.STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(state.recentSearches));
  localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_CITY, name);
  renderRecentSearches();
  updateActiveCityChip(name);
}

function renderRecentSearches() {
  if (!DOM.recentSearchesContainer || !DOM.recentChips) return;

  if (state.recentSearches.length === 0) {
    DOM.recentSearchesContainer.style.display = 'none';
    return;
  }

  DOM.recentSearchesContainer.style.display = 'flex';
  DOM.recentChips.innerHTML = '';

  state.recentSearches.forEach(city => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `city-chip ${city.toLowerCase() === state.currentCity.toLowerCase() ? 'active' : ''}`;
    chip.textContent = city;
    chip.addEventListener('click', () => {
      DOM.cityInput.value = city;
      fetchWeatherByCity(city);
    });
    DOM.recentChips.appendChild(chip);
  });
}

function updateActiveCityChip(cityName) {
  const cleanTarget = cleanCityQuery(cityName).toLowerCase();
  document.querySelectorAll('.city-chip').forEach(chip => {
    const chipData = (chip.getAttribute('data-city') || chip.textContent).toLowerCase();
    const cleanChip = cleanCityQuery(chipData).toLowerCase();
    if (cleanChip === cleanTarget || chipData.includes(cleanTarget)) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

// ==========================================================================
// 9. Theme Management System
// ==========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  setTheme(initialTheme, false);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem(CONFIG.STORAGE_KEYS.THEME)) {
      setTheme(e.matches ? 'dark' : 'light', false);
    }
  });
}

function setTheme(theme, save = true) {
  document.documentElement.setAttribute('data-theme', theme);
  if (save) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
  }
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme, true);
  showToast(`Switched to ${newTheme} mode`, 'info');
}

// ==========================================================================
// 10. Unit Toggle Management (°C / °F)
// ==========================================================================
function setUnit(unit) {
  if (state.unit === unit) return;
  state.unit = unit;
  localStorage.setItem(CONFIG.STORAGE_KEYS.UNIT, unit);

  if (unit === 'metric') {
    DOM.unitCelsius.classList.add('active');
    DOM.unitCelsius.setAttribute('aria-pressed', 'true');
    DOM.unitFahrenheit.classList.remove('active');
    DOM.unitFahrenheit.setAttribute('aria-pressed', 'false');
  } else {
    DOM.unitFahrenheit.classList.add('active');
    DOM.unitFahrenheit.setAttribute('aria-pressed', 'true');
    DOM.unitCelsius.classList.remove('active');
    DOM.unitCelsius.setAttribute('aria-pressed', 'false');
  }

  renderAllWeather();
  showToast(`Temperature unit set to °${unit === 'metric' ? 'C' : 'F'}`, 'info');
}

// ==========================================================================
// 11. Modal, Toast & Loading Feedback
// ==========================================================================
function showLoading(isLoading) {
  DOM.loadingOverlay.style.display = isLoading ? 'flex' : 'none';
}

function showErrorModal(title, message) {
  DOM.errorModalTitle.textContent = title;
  DOM.errorModalMsg.textContent = message;
  DOM.errorModal.style.display = 'flex';
}

function hideErrorModal() {
  DOM.errorModal.style.display = 'none';
}

function showStatusBanner(text) {
  DOM.statusBannerText.textContent = text;
  DOM.statusBanner.style.display = 'flex';
}

function hideStatusBanner() {
  DOM.statusBanner.style.display = 'none';
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const iconName = type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-triangle' : 'info');
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;

  DOM.toastContainer.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================================================
// 12. Settings Modal & API Key Management
// ==========================================================================
function openSettingsModal() {
  DOM.apiKeyInput.value = state.apiKey;
  updateApiKeyStatusUI();
  DOM.settingsModal.style.display = 'flex';
}

function closeSettingsModal() {
  DOM.settingsModal.style.display = 'none';
}

function updateApiKeyStatusUI() {
  if (state.apiKey && state.apiKey.length >= 20) {
    DOM.apiStatusIndicator.className = 'api-status-indicator connected';
    DOM.apiStatusText.textContent = 'Custom OpenWeather API key configured';
  } else {
    DOM.apiStatusIndicator.className = 'api-status-indicator';
    DOM.apiStatusText.textContent = 'Using Bangladesh demo simulation mode';
  }
}

// ==========================================================================
// 13. Event Listeners & Initialization
// ==========================================================================
function setupEventListeners() {
  // Search Form Submit
  DOM.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = DOM.cityInput.value.trim();
    if (query) {
      fetchWeatherByCity(query);
    }
  });

  // Search Clear Button visibility & action
  DOM.cityInput.addEventListener('input', () => {
    DOM.clearSearchBtn.style.display = DOM.cityInput.value.length > 0 ? 'flex' : 'none';
  });

  DOM.clearSearchBtn.addEventListener('click', () => {
    DOM.cityInput.value = '';
    DOM.clearSearchBtn.style.display = 'none';
    DOM.cityInput.focus();
  });

  // Geolocation Button
  DOM.locationBtn.addEventListener('click', () => {
    if ('geolocation' in navigator) {
      showLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          showLoading(false);
          console.warn('Geolocation denied or failed:', error);
          showToast('Location permission denied. Searching Dhaka.', 'error');
          fetchWeatherByCity(CONFIG.DEFAULT_CITY);
        },
        { timeout: 8000 }
      );
    } else {
      showToast('Geolocation is not supported by your browser.', 'error');
    }
  });

  // Quick City Chips Click
  document.querySelectorAll('.city-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const city = chip.getAttribute('data-city') || chip.textContent.trim();
      DOM.cityInput.value = cleanCityQuery(city);
      fetchWeatherByCity(city);
    });
  });

  // Unit Toggles
  DOM.unitCelsius.addEventListener('click', () => setUnit('metric'));
  DOM.unitFahrenheit.addEventListener('click', () => setUnit('imperial'));

  // Theme Toggle Button
  DOM.themeToggleBtn.addEventListener('click', toggleTheme);

  // Status Banner Close
  DOM.statusBannerClose.addEventListener('click', hideStatusBanner);

  // Hourly Slider Buttons
  DOM.hourlySlideLeft.addEventListener('click', () => {
    DOM.hourlyForecastTrack.scrollBy({ left: -220, behavior: 'smooth' });
  });
  DOM.hourlySlideRight.addEventListener('click', () => {
    DOM.hourlyForecastTrack.scrollBy({ left: 220, behavior: 'smooth' });
  });

  // Modals Close Actions
  DOM.errorModalCloseBtn.addEventListener('click', hideErrorModal);
  DOM.errorModal.addEventListener('click', (e) => {
    if (e.target === DOM.errorModal) hideErrorModal();
  });

  DOM.settingsModalBtn.addEventListener('click', openSettingsModal);
  DOM.closeSettingsBtn.addEventListener('click', closeSettingsModal);
  DOM.settingsModal.addEventListener('click', (e) => {
    if (e.target === DOM.settingsModal) closeSettingsModal();
  });

  // Toggle API Key Password Visibility
  DOM.toggleKeyVisibilityBtn.addEventListener('click', () => {
    const isPassword = DOM.apiKeyInput.type === 'password';
    DOM.apiKeyInput.type = isPassword ? 'text' : 'password';
    DOM.toggleKeyIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
    if (window.lucide) window.lucide.createIcons();
  });

  // Save API Key Form
  DOM.apiSettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const key = DOM.apiKeyInput.value.trim();
    state.apiKey = key;
    if (key) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.API_KEY, key);
      showToast('API key saved! Fetching live weather...', 'success');
    } else {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.API_KEY);
      showToast('API key removed. Running in demo mode.', 'info');
    }
    updateApiKeyStatusUI();
    closeSettingsModal();
    fetchWeatherByCity(state.currentCity || CONFIG.DEFAULT_CITY);
  });

  // Clear API Key Button
  DOM.clearApiKeyBtn.addEventListener('click', () => {
    state.apiKey = '';
    DOM.apiKeyInput.value = '';
    localStorage.removeItem(CONFIG.STORAGE_KEYS.API_KEY);
    updateApiKeyStatusUI();
    showToast('API key cleared.', 'info');
  });

  // Global Escape key modal dismiss
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideErrorModal();
      closeSettingsModal();
    }
  });
}

// ==========================================================================
// 14. Application Bootstrapper
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Theme & Units
  initTheme();
  
  if (state.unit === 'imperial') {
    DOM.unitFahrenheit.classList.add('active');
    DOM.unitCelsius.classList.remove('active');
  }

  // 2. Setup Event Listeners
  setupEventListeners();

  // 3. Render Initial State
  renderRecentSearches();

  // 4. Initial Weather Load (Default: Dhaka)
  const initialCity = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_CITY) || CONFIG.DEFAULT_CITY;
  DOM.cityInput.value = initialCity;
  fetchWeatherByCity(initialCity);
});
