const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

// Kısa linkleri güvenli bir şekilde gerçek adrese çeviren gelişmiş fonksiyon
async function expandUrl(inputUrl) {
    if (!inputUrl.includes('vt.tiktok.com') && !inputUrl.includes('vm.tiktok.com')) {
        return inputUrl;
    }
    try {
        const response = await axios.get(inputUrl, {
            maxRedirects: 5,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            }
        });
        // Node.js ortamında yönlendirme sonrasındaki nihai URL
        return response.request.res.responseUrl || response.config.url || inputUrl;
    } catch (error) {
        // Bazı durumlarda redirect hatasında bile responseUrl error içinde gelebilir
        if (error.request && error.request.res && error.request.res.responseUrl) {
            return error.request.res.responseUrl;
        }
        console.error("URL genişletilemedi, orijinali deneniyor:", error.message);
        return inputUrl;
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
        // 1. Adım: Kısa linki çöz
        const resolvedUrl = await expandUrl(tiktokUrl);
        console.log("İşlenen Video URL:", resolvedUrl);

        // 2. Adım: API'ye gönder
        const targetApi = `https://www.tikwm.com/api/?url=${encodeURIComponent(resolvedUrl)}`;
        const response = await axios.get(targetApi, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
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
