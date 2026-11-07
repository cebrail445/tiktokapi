const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

// İstekleri tarayıcı gibi gösteren gelişmiş headers
const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
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

        // Eğer gelen link kısaysa, TikTok'un engelini aşmak için alternatif yönlendirme yakalayıcı kullanıyoruz
        if (tiktokUrl.includes('vt.tiktok.com') || tiktokUrl.includes('vm.tiktok.com')) {
            try {
                // Axios maxRedirects ile yönlendirmeyi takip etmeye çalışır
                const redirectRes = await axios.get(tiktokUrl, {
                    maxRedirects: 5,
                    headers: browserHeaders,
                    validateStatus: function (status) {
                        return status >= 200 && status < 403; // Yönlendirme kodlarını kabul et
                    }
                });
                
                // Eğer nihai URL bulunduysa onu al
                if (redirectRes.request && redirectRes.request.res && redirectRes.request.res.responseUrl) {
                    finalUrl = redirectRes.request.res.responseUrl;
                }
            } catch (redirError) {
                // Axios redirect'te takılsa bile error nesnesinin içinde responseUrl kalmış olabilir
                if (redirError.response && redirError.response.request && redirError.response.request.res && redirError.response.request.res.responseUrl) {
                    finalUrl = redirError.response.request.res.responseUrl;
                }
            }
        }

        console.log("İşlenen Nihai URL:", finalUrl);

        // TikWM API'sine çözülmüş veya orijinal linki gönderiyoruz
        const targetApi = `https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}`;
        
        const response = await axios.get(targetApi, {
            headers: browserHeaders
        });
        
        return res.json(response.data);
    } catch (error) {
        console.error("İstek hatası:", error.message);
        return res.status(500).json({ 
            status: "error", 
            message: "Sunucu hatası: TikTok bağlantısı engellendi veya geçersiz link." 
        });
    }
});

app.listen(PORT, () => {
    console.log(`API sunucumuz ${PORT} portunda arı gibi çalışıyor usta! 🚀`);
});
