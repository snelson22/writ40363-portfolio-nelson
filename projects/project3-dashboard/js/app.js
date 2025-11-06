// ==========================================
// PROJECT 3: PERSONAL DATA DASHBOARD
// LAB16: fetch() and JSON Basics
// ==========================================

console.log('Dashboard app loaded!');
console.log('LAB16: Learning fetch() API');

// Function to load weather data
function loadWeather() {
    console.log('🌤️ Loading weather data...');

    fetch('./data/weather.json')
        .then(response => {
            console.log('✅ Got response:', response);
            return response.json();
        })
        .then(data => {
            console.log('✅ Weather data loaded:', data);
            displayWeather(data);
        })
        .catch(error => {
            console.error('❌ Error loading weather:', error);
            displayWeatherError();
        });
}

// Function to display weather data in the DOM
function displayWeather(weather) {
    console.log('📊 Displaying weather data...');

    const weatherDisplay = document.getElementById('weather-display');

    weatherDisplay.innerHTML = `
        <div class="weather-current">
            <div class="weather-icon">${weather.icon}</div>
            <div class="weather-temp">${weather.temperature}°F</div>
            <div class="weather-location">${weather.location}</div>
            <div class="weather-condition">${weather.condition}</div>
        </div>
        <div class="weather-details">
            <div class="weather-detail">
                <span>💧 Humidity</span>
                <strong>${weather.humidity}%</strong>
            </div>
            <div class="weather-detail">
                <span>💨 Wind Speed</span>
                <strong>${weather.windSpeed} mph</strong>
            </div>
            <div class="weather-detail">
                <span>🌡️ Feels Like</span>
                 <strong>${weather.feelsLike}°F</strong>
            </div>
        </div>
    `;

    console.log('✅ Weather displayed successfully!');
}

// Function to show error message if weather data fails to load
function displayWeatherError() {
    const weatherDisplay = document.getElementById('weather-display');

    weatherDisplay.innerHTML = `
        <div class="error-message">
            <div class="error-icon">⚠️</div>
            <p>Could not load weather data</p>
            <p class="error-hint">Check console for details</p>
        </div>
    `;
}

// Load weather data when page loads
loadWeather();