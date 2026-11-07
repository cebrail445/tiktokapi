const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

// Kısa linkleri (vt.tiktok.com vb.) gerçek TikTok adresine çeviren fonksiyon
async function expandUrl(inputUrl) {
    try {
        const response = await axios.get(inputUrl, {
            maxRedirects: 5,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        // Axios yönlendirmeleri takip eder ve son URL'yi buruşur
        return response.request.res.responseUrl || inputUrl;
    } catch (error) {
        return inputUrl; // Hata olursa orijinalini döndür
    }
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
        // 1. Adım: Kısa linkse gerçek adrese genişlet
        const resolvedUrl = await expandUrl(tiktokUrl);

        // 2. Adım: Gerçek adresi TikWM API'sine gönder
        const targetApi = `https://www.tikwm.com/api/?url=${encodeURIComponent(resolvedUrl)}`;
        const response = await axios.get(targetApi, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        return res.json(response.data);
    } catch (error) {
        console.error("İstek hatası:", error.message);
        return res.status(500).json({ 
            status: "error", 
            message: "Sunucu tarafında veri çekilirken hata oluştu usta." 
        });
    }
});

app.listen(PORT, () => {
    console.log(`API sunucumuz ${PORT} portunda arı gibi çalışıyor usta! 🚀`);
});
