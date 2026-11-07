const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

// Tarayıcı taklidi yapan profesyonel headers
const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
};

app.get('/api/download', async (req, res) => {
    let tiktokUrl = req.query.url;

    if (!tiktokUrl) {
        return res.status(400).json({ 
            status: "error", 
            message: "Usta, URL parametresi eksik! ?url=... şeklinde gönder." 
        });
    }

    try {
        console.log("Gelen Orijinal URL:", tiktokUrl);

        // TikWM API'sine doğrudan gönderiyoruz. TikWM kendi altyapısıyla bu linkleri işler.
        // Render IP engelini bypas etmek için isteği optimize ettik.
        const targetApi = `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}&hd=1`;
        
        const response = await axios.get(targetApi, { 
            headers: browserHeaders,
            timeout: 10000 // 10 saniye zaman aşımı koruması
        });
        
        // TikWM'den gelen yanıtı direkt istemciye iletiyoruz
        return res.json(response.data);

    } catch (error) {
        console.error("API İstek Hatası:", error.message);
        
        // Asla ham 500 çökmesi vermiyoruz, mobil uygulamanın okuyabileceği formatta dönüyoruz
        return res.status(200).json({ 
            status: "error", 
            message: "Usta TikTok isteği engelledi. Lütfen tekrar dene veya uzun link kullan." 
        });
    }
});

app.listen(PORT, () => {
    console.log(`API sunucumuz ${PORT} portunda arı gibi çalışıyor usta! 🚀`);
});
