import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

  app.get("/api/weather", async (req, res) => {
    const { lat, lon, city } = req.query;
    
    try {
      if (!OPENWEATHER_API_KEY) {
        return res.status(500).json({ error: "OpenWeather API Key is missing. Please add it to your secrets." });
      }

      let targetLat = lat;
      let targetLon = lon;

      // If city name is provided, geocode it first
      if (city && !lat) {
        const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${OPENWEATHER_API_KEY}`;
        const geoRes = await axios.get(geoUrl);
        if (geoRes.data.length === 0) return res.status(404).json({ error: "City not found" });
        targetLat = geoRes.data[0].lat;
        targetLon = geoRes.data[0].lon;
      }

      // Fetch Weather
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${targetLat}&lon=${targetLon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
      const weatherRes = await axios.get(weatherUrl);

      // Fetch Air Pollution
      const pollutionUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${targetLat}&lon=${targetLon}&appid=${OPENWEATHER_API_KEY}`;
      const pollutionRes = await axios.get(pollutionUrl);

      res.json({
        weather: weatherRes.data,
        pollution: pollutionRes.data.list[0],
        location: { lat: targetLat, lon: targetLon, name: weatherRes.data.name }
      });
    } catch (error: any) {
      console.error("API Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to fetch atmospheric data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
