const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

// Tarayıcı taklidi yapan profesyonel headers
const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
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
        let finalUrl = tiktokUrl;

        // Kısa link ise Render IP engeline takılmamak için alternatif ve güvenli unshorten yöntemi
        if (tiktokUrl.includes('vt.tiktok.com') || tiktokUrl.includes('vm.tiktok.com')) {
            try {
                // Alternatif hafif bir yönlendirme servisi üzerinden gerçek linki çözüyoruz
                const unshortenRes = await axios.get(`https://unshorten.me/json/${encodeURIComponent(tiktokUrl)}`, {
                    timeout: 5000
                });
                if (unshortenRes.data && unshortenRes.data.resolved_url) {
                    finalUrl = unshortenRes.data.resolved_url;
                }
            } catch (err) {
                // Eğer unshorten servisi yanıt vermezse kendi yönlendirme denememize geçiyoruz
                try {
                    const directRes = await axios.get(tiktokUrl, {
                        maxRedirects: 5,
                        headers: browserHeaders,
                        validateStatus: (status) => status >= 200 && status < 405
                    });
                    if (directRes.request && directRes.request.res && directRes.request.res.responseUrl) {
                        finalUrl = directRes.request.res.responseUrl;
                    }
                } catch (e) {
                    // Çözülemezse orijinal linkle devam etmeyi dene
                    finalUrl = tiktokUrl;
                }
            }
        }

        console.log("İşlenen Nihai URL:", finalUrl);

        // TikWM API'sine istek atıyoruz
        const targetApi = `https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}`;
        const response = await axios.get(targetApi, { headers: browserHeaders });
        
        return res.json(response.data);
    } catch (error) {
        console.error("İstek hatası:", error.message);
        return res.status(500).json({ 
            status: "error", 
            message: "Sunucu hatası: Kısa link çözülemedi, lütfen uzun link deneyin usta." 
        });
    }
});

app.listen(PORT, () => {
    console.log(`API sunucumuz ${PORT} portunda arı gibi çalışıyor usta! 🚀`);
});
