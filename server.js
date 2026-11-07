const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

// Mobil tarayıcı (iPhone Safari) kimliği - TikTok bu başlıklı isteklere yönlendirme adresini direkt verir
const mobileHeaders = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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

        // Eğer gelen link kısaysa, arkasındaki gerçek TikTok adresini yakalayalım
        if (tiktokUrl.includes('vt.tiktok.com') || tiktokUrl.includes('vm.tiktok.com')) {
            try {
                // maxRedirects: 0 yaparak TikTok'un bize verdiği 302 yönlendirme konumunu (location) yakalıyoruz
                const response = await axios.get(tiktokUrl, {
                    maxRedirects: 0,
                    validateStatus: function (status) {
                        return status >= 200 && status < 400; // Yönlendirme kodlarını kabul et
                    },
                    headers: mobileHeaders
                });

                if (response.headers && response.headers.location) {
                    finalUrl = response.headers.location;
                }
            } catch (redirErr) {
                // Alternatif olarak standart axios yönlendirme takibini dene
                try {
                    const fallbackRes = await axios.get(tiktokUrl, {
                        maxRedirects: 5,
                        headers: mobileHeaders
                    });
                    if (fallbackRes.request && fallbackRes.request.res && fallbackRes.request.res.responseUrl) {
                        finalUrl = fallbackRes.request.res.responseUrl;
                    }
                } catch (e) {
                    console.error("Kısa link çözme denemesi başarısız:", e.message);
                }
            }
        }

        console.log("Çözülen Nihai URL:", finalUrl);

        // Bulduğumuz gerçek ve uzun TikTok adresini TikWM API'sine gönderiyoruz
        const targetApi = `https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}&hd=1`;
        
        const apiResponse = await axios.get(targetApi, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 10000 
        });
        
        return res.json(apiResponse.data);

    } catch (error) {
        console.error("API İstek Hatası:", error.message);
        return res.status(200).json({ 
            status: "error", 
            message: "Usta video bulunamadı veya kısa link çözülemedi." 
        });
    }
});

app.listen(PORT, () => {
    console.log(`API sunucumuz ${PORT} portunda arı gibi çalışıyor usta! 🚀`);
});
