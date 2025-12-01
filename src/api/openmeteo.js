const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

export async function searchCities(name, count = 8, language = "en") {
  if (!name?.trim()) return [];
  const u = new URL(GEOCODE_URL);
  u.searchParams.set("name", name);
  u.searchParams.set("count", String(count));
  u.searchParams.set("language", language);
  u.searchParams.set("format", "json");
  const res = await fetch(u.toString());
  if (!res.ok) throw new Error("Failed to search cities");
  const data = await res.json();
  return (data.results || []).map((r) => ({
    id: `${r.id}`,
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    lat: r.latitude,
    lon: r.longitude,
    timezone: r.timezone,
  }));
}

export async function fetchWeather({ lat, lon, unit = "C" }) {
  const u = new URL(FORECAST_URL);
  u.searchParams.set("latitude", String(lat));
  u.searchParams.set("longitude", String(lon));
  u.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code"
  );
  u.searchParams.set(
    "hourly",
    "temperature_2m,relative_humidity_2m,wind_speed_10m"
  );
  u.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset"
  );
  u.searchParams.set("timezone", "auto");
  u.searchParams.set("temperature_unit", unit === "C" ? "celsius" : "fahrenheit");
  u.searchParams.set("wind_speed_unit", "kmh");
  u.searchParams.set("precipitation_unit", "mm");

  const res = await fetch(u.toString());
  if (!res.ok) throw new Error("Failed to fetch weather");
  const json = await res.json();

  return normalizeForecast(json, unit);
}

export async function fetchAirQuality({ lat, lon }) {
  const u = new URL(AIR_URL);
  u.searchParams.set("latitude", String(lat));
  u.searchParams.set("longitude", String(lon));
  u.searchParams.set("hourly", "us_aqi,pm2_5");
  u.searchParams.set("timezone", "auto");
  const res = await fetch(u.toString());
  if (!res.ok) return null; // not fatal
  const json = await res.json();
  const t = json?.hourly?.time;
  const a = json?.hourly?.us_aqi;
  if (!t || !a || !a.length) return null;
  const last = a[a.length - 1];
  return Math.round(last);
}

function normalizeForecast(raw, unit) {
  const cur = raw.current || raw.current_weather || {};
  const daily = raw.daily || {};
  const hourly = raw.hourly || {};

  const tz = raw.timezone || "local";
  const hours = (hourly.time || []).map((iso, i) => ({
    time: new Date(iso),
    temp: hourly.temperature_2m?.[i],
    humidity: hourly.relative_humidity_2m?.[i],
    wind: hourly.wind_speed_10m?.[i],
  }));

  const days = (daily.time || []).map((iso, i) => ({
    date: new Date(iso),
    min: Math.round(daily.temperature_2m_min?.[i]),
    max: Math.round(daily.temperature_2m_max?.[i]),
    uv: daily.uv_index_max?.[i] ?? 0,
    code: daily.weather_code?.[i],
    sunrise: daily.sunrise?.[i],
    sunset: daily.sunset?.[i],
  }));

  return {
    tz,
    unit,
    current: {
      temp: cur.temperature_2m ?? cur.temperature,
      feels: cur.apparent_temperature ?? cur.temperature_2m,
      humidity: cur.relative_humidity_2m,
      wind: cur.wind_speed_10m ?? cur.windspeed,
      code: cur.weather_code ?? cur.weathercode,
    },
    hours,
    days,
  };
}
