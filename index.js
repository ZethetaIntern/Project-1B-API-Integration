const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the public directory
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// A simple endpoint that integrates with a public 3rd party API
app.get('/api/joke', async (req, res) => {
    try {
        // We are integrating with the Official Joke API
        const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
        
        // Custom formatting or logic can be applied here
        const jokeData = {
            success: true,
            source: 'Official Joke API',
            data: {
                setup: response.data.setup,
                punchline: response.data.punchline
            }
        };

        res.json(jokeData);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch data from the external API'
        });
    }
});

// A health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'UP', message: 'API Integration Server is running!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Test the custom API integration at http://localhost:${PORT}/api/joke`);
});
