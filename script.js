// Weather App JavaScript
class WeatherApp {
    constructor() {
        this.apiKey = '18924f3837c128293909bdd603e13135'; // OpenWeatherMap API (free tier)
        this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
        this.unit = 'metric'; // metric for Celsius, imperial for Fahrenheit
        this.recentSearchesList = JSON.parse(localStorage.getItem('recentSearches')) || [];
        
        this.initializeElements();
        this.bindEvents();
        this.loadRecentSearches();
    }

    initializeElements() {
        // Input elements
        this.cityInput = document.getElementById('cityInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.locationBtn = document.getElementById('locationBtn');
        
        // Display elements
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.weatherDisplay = document.getElementById('weatherDisplay');
        this.recentSearchesElement = document.getElementById('recentSearches');
        this.recentList = document.getElementById('recentList');
        
        // Weather data elements
        this.cityName = document.getElementById('cityName');
        this.countryName = document.getElementById('countryName');
        this.dateTime = document.getElementById('dateTime');
        this.temperature = document.getElementById('temperature');
        this.weatherIcon = document.getElementById('weatherIcon');
        this.weatherDescription = document.getElementById('weatherDescription');
        this.feelsLike = document.getElementById('feelsLike');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        this.pressure = document.getElementById('pressure');
        this.visibility = document.getElementById('visibility');
        this.uvIndex = document.getElementById('uvIndex');
        this.tempMin = document.getElementById('tempMin');
        this.tempMax = document.getElementById('tempMax');
        
        // Unit toggle buttons
        this.celsiusBtn = document.getElementById('celsiusBtn');
        this.fahrenheitBtn = document.getElementById('fahrenheitBtn');
    }

    bindEvents() {
        // Search functionality
        this.searchBtn.addEventListener('click', () => this.searchWeather());
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchWeather();
        });
        
        // Location functionality
        this.locationBtn.addEventListener('click', () => this.getCurrentLocation());
        
        // Unit toggle
        this.celsiusBtn.addEventListener('click', () => this.setUnit('metric'));
        this.fahrenheitBtn.addEventListener('click', () => this.setUnit('imperial'));
    }

    async searchWeather() {
        const city = this.cityInput.value.trim();
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }

        this.showLoading();
        try {
            const weatherData = await this.fetchWeatherData(city);
            this.displayWeather(weatherData);
            this.addToRecentSearches(city);
            this.hideError();
        } catch (error) {
            this.showError(error.message);
        }
    }

    async getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser');
            return;
        }

        this.showLoading();
        try {
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;
            const weatherData = await this.fetchWeatherDataByCoords(latitude, longitude);
            this.displayWeather(weatherData);
            this.hideError();
        } catch (error) {
            this.showError('Unable to get your location. Please check your permissions.');
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                enableHighAccuracy: true
            });
        });
    }

    async fetchWeatherData(city) {
        const url = `${this.baseUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=${this.unit}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the spelling and try again.');
            } else if (response.status === 401) {
                throw new Error('API key error. Please contact support.');
            } else {
                throw new Error('Failed to fetch weather data. Please try again.');
            }
        }
        
        return await response.json();
    }

    async fetchWeatherDataByCoords(lat, lon) {
        const url = `${this.baseUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.unit}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather data for your location.');
        }
        
        return await response.json();
    }

    displayWeather(data) {
        // Update location info
        this.cityName.textContent = data.name;
        this.countryName.textContent = data.sys.country;
        this.dateTime.textContent = this.formatDateTime(new Date());

        // Update main weather info
        this.temperature.textContent = Math.round(data.main.temp);
        this.weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        this.weatherDescription.textContent = data.weather[0].description;

        // Update weather details
        this.feelsLike.textContent = `${Math.round(data.main.feels_like)}°${this.unit === 'metric' ? 'C' : 'F'}`;
        this.humidity.textContent = `${data.main.humidity}%`;
        this.windSpeed.textContent = `${this.convertWindSpeed(data.wind.speed)}`;
        this.pressure.textContent = `${data.main.pressure} hPa`;
        this.visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        this.uvIndex.textContent = 'N/A'; // UV index requires separate API call

        // Update temperature range
        this.tempMin.textContent = `${Math.round(data.main.temp_min)}°${this.unit === 'metric' ? 'C' : 'F'}`;
        this.tempMax.textContent = `${Math.round(data.main.temp_max)}°${this.unit === 'metric' ? 'C' : 'F'}`;

        this.showWeatherDisplay();
    }

    convertWindSpeed(speed) {
        if (this.unit === 'metric') {
            return `${(speed * 3.6).toFixed(1)} km/h`; // Convert m/s to km/h
        } else {
            return `${speed.toFixed(1)} mph`; // Already in mph for imperial
        }
    }

    formatDateTime(date) {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-US', options);
    }

    setUnit(unit) {
        this.unit = unit;
        
        // Update button states
        this.celsiusBtn.classList.toggle('active', unit === 'metric');
        this.fahrenheitBtn.classList.toggle('active', unit === 'imperial');
        
        // Update temperature display
        if (this.weatherDisplay.classList.contains('hidden')) return;
        
        // Re-fetch data with new unit
        const city = this.cityName.textContent;
        if (city && city !== 'City Name') {
            this.fetchWeatherData(city).then(data => {
                this.displayWeather(data);
            }).catch(error => {
                this.showError(error.message);
            });
        }
    }

    addToRecentSearches(city) {
        // Remove if already exists
        this.recentSearchesList = this.recentSearchesList.filter(item => item !== city);
        
        // Add to beginning
        this.recentSearchesList.unshift(city);
        
        // Keep only last 5 searches
        this.recentSearchesList = this.recentSearchesList.slice(0, 5);
        
        // Save to localStorage
        localStorage.setItem('recentSearches', JSON.stringify(this.recentSearchesList));
        
        // Update display
        this.loadRecentSearches();
    }

    loadRecentSearches() {
        if (this.recentSearchesList.length === 0) {
            this.recentSearchesElement.classList.add('hidden');
            return;
        }

        this.recentSearchesElement.classList.remove('hidden');
        this.recentList.innerHTML = '';

        this.recentSearchesList.forEach(city => {
            const item = document.createElement('div');
            item.className = 'recent-item';
            item.textContent = city;
            item.addEventListener('click', () => {
                this.cityInput.value = city;
                this.searchWeather();
            });
            this.recentList.appendChild(item);
        });
    }

    showLoading() {
        this.loading.classList.remove('hidden');
        this.weatherDisplay.classList.add('hidden');
        this.error.classList.add('hidden');
    }

    showWeatherDisplay() {
        this.loading.classList.add('hidden');
        this.weatherDisplay.classList.remove('hidden');
        this.error.classList.add('hidden');
    }

    showError(message) {
        this.loading.classList.add('hidden');
        this.weatherDisplay.classList.add('hidden');
        this.error.classList.remove('hidden');
        document.getElementById('errorMessage').textContent = message;
    }

    hideError() {
        this.error.classList.add('hidden');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

// Add some nice background animations
document.addEventListener('DOMContentLoaded', () => {
    // Create floating weather icons in background
    const background = document.body;
    const weatherIcons = ['☀️', '☁️', '🌧️', '❄️', '🌈', '⚡'];
    
    for (let i = 0; i < 10; i++) {
        const icon = document.createElement('div');
        icon.textContent = weatherIcons[Math.floor(Math.random() * weatherIcons.length)];
        icon.style.position = 'fixed';
        icon.style.left = Math.random() * 100 + 'vw';
        icon.style.top = Math.random() * 100 + 'vh';
        icon.style.fontSize = '2rem';
        icon.style.opacity = '0.1';
        icon.style.pointerEvents = 'none';
        icon.style.animation = `float ${10 + Math.random() * 20}s linear infinite`;
        background.appendChild(icon);
    }
});

// Add floating animation
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
        10% { opacity: 0.1; }
        90% { opacity: 0.1; }
        100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
    }
`;
document.head.appendChild(style);
