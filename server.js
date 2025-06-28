const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve the main HTML file first (before static middleware)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// Serve static files (but exclude HTML files from root to avoid conflicts)
app.use(express.static('.', {
    index: false // Disable automatic index.html serving
}));

// Also serve home.html directly
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// API endpoint to get Azure Speech configuration
app.get('/api/speech-config', (req, res) => {
    try {
        // Return only the necessary configuration without exposing the full key
        res.json({
            region: process.env.AZURE_SPEECH_REGION,
            // We'll use a token-based approach for better security
            success: true
        });
    } catch (error) {
        console.error('Error getting speech config:', error);
        res.status(500).json({ error: 'Failed to get speech configuration' });
    }
});

// API endpoint to get Azure Speech token
app.post('/api/speech-token', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        
        const tokenUrl = `https://${process.env.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.ok) {
            const token = await response.text();
            res.json({
                token: token,
                region: process.env.AZURE_SPEECH_REGION
            });
        } else {
            throw new Error('Failed to get token');
        }
    } catch (error) {
        console.error('Error getting speech token:', error);
        res.status(500).json({ error: 'Failed to get speech token' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
