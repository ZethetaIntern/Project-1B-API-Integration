const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/location-info', async (req, res) => {
    const city = req.query.city;
    if (!city) {
        return res.status(400).json({ success: false, message: 'City parameter is required' });
    }

    try {
        // 1. Fetch Location Coordinates (Open-Meteo Geocoding API)
        const geoResponse = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
        
        if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
            return res.status(404).json({ success: false, message: 'City not found' });
        }
        
        const location = geoResponse.data.results[0];
        const { latitude, longitude, country, country_code } = location;

        // 2. Fetch Current Weather (Open-Meteo Weather API)
        const weatherResponse = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const weather = weatherResponse.data.current_weather;

        // 3. Fetch Country Details (REST Countries API)
        let countryInfo = null;
        try {
            const countryResponse = await axios.get(`https://restcountries.com/v3.1/alpha/${country_code}`);
            if (countryResponse.data && countryResponse.data.length > 0) {
                const c = countryResponse.data[0];
                countryInfo = {
                    name: c.name.common,
                    region: c.region,
                    population: c.population,
                    flag: c.flags.svg
                };
            }
        } catch (err) {
            console.error('Error fetching country data:', err.message);
            // We proceed even if country API fails
        }

        // 4. Aggregate and Send Data
        res.json({
            success: true,
            data: {
                city: location.name,
                country: country,
                coordinates: { latitude, longitude },
                weather: {
                    temperature: weather.temperature,
                    windspeed: weather.windspeed,
                    time: weather.time
                },
                countryInfo
            }
        });

    } catch (error) {
        console.error('Error aggregating API data:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching data'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'UP', message: 'API Integration Server is running!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
