const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GNEWS_API_KEY || !GEMINI_API_KEY) {
    console.error("FATAL ERROR: API keys are not defined in the .env file.");
    process.exit(1);
}

const formatArticles = (articles) => {
    return articles.map(article => ({
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        image: article.image,
        publishedAt: article.publishedAt,
        source: article.source,
    }));
};

app.get('/api/news', async (req, res) => {
    const { category = 'general' } = req.query;
    const url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&country=in&apikey=${GNEWS_API_KEY}`;

    try {
        const response = await axios.get(url);
        const formatted = formatArticles(response.data.articles);
        res.json({ articles: formatted });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch news articles.' });
    }
});

app.post('/api/summarize', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }
    
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
        const response = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: prompt }] }]
        });
        const summary = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!summary) {
            return res.status(500).json({ error: "Could not get summary from AI." });
        }
        res.json({ summary });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate summary.' });
    }
});

app.listen(PORT, () => {
    console.log(`Simple news server is running on http://localhost:${PORT}`);
});
