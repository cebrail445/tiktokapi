const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/api/download', async (req, res) => {
    const tiktokUrl = req.query.url;

    if (!tiktokUrl) {
        return res.status(400).json({ 
            status: "error", 
            message: "Usta, URL parametresi eksik! ?url=... şeklinde gönder." 
        });
    }

    try {
        // Kısa linkleri veya normal linkleri doğrudan TikWM'ye yolluyoruz, 
        // çünkü TikWM kendi içinde kısa linkleri zaten çözebiliyor.
        const targetApi = `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;
        
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
