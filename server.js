const express = require('express');
const axios = require('axios');
const cors = require('cors');
const https = require('https');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

// Kısa linkleri native https modülü ile kesin olarak çözen fonksiyon
function resolveTikTokUrl(url) {
    return new Promise((resolve) => {
        if (!url.includes('tiktok.com')) {
            return resolve(url);
        }

        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
            if (res.headers.location) {
                resolve(res.headers.location);
            } else {
                resolve(url);
            }
        }).on('error', () => {
            resolve(url);
        });
    });
}

app.get('/api/download', async (req, res) => {
    const tiktokUrl = req.query.url;

    if (!tiktokUrl) {
        return res.status(400).json({ 
            status: "error", 
            message: "Usta, URL parametresi eksik! ?url=... şeklinde gönder." 
        });
    }

    try {
        // 1. Kısa linki gerçek TikTok adresine çevir
        const longUrl = await resolveTikTokUrl(tiktokUrl);
        console.log("Çözülen URL:", longUrl);

        // 2. Gerçek adresi TikWM API'sine gönder
        const targetApi = `https://www.tikwm.com/api/?url=${encodeURIComponent(longUrl)}`;
        
        const response = await axios.get(targetApi, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            }
        });
        
        return res.json(response.data);
    } catch (error) {
        console.error("İstek hatası:", error.message);
        return res.status(500).json({ 
            status: "error", 
            message: "Sunucu hatası: " + error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`API sunucumuz ${PORT} portunda arı gibi çalışıyor usta! 🚀`);
});
