const express = require('express');
const axios = require('axios');
const cors = require('cors'); // 1. CORS paketi dahil edildi
const app = express();

const PORT = process.env.PORT || 3000;

// 2. CORS middleware aktif edildi (Tüm tarayıcı isteklerine izin verir)
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
        const targetApi = `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;
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
}); // <-- Buradaki kapatma parantezi eksikti, eklendi!

app.listen(PORT, () => {
    console.log(`API sunucumuz ${PORT} portunda arı gibi çalışıyor usta! 🚀`); 
});
