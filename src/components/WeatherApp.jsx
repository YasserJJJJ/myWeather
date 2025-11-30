import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CloudSun, MapPin, Search as SearchIcon, Wind, Droplets,
  SunMedium, Moon, Thermometer, TriangleAlert, CloudDrizzle, CloudRainWind, Cloud, Sun, CloudLightning, Snowflake
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { searchCities, fetchWeather, fetchAirQuality } from "../api/openmeteo";
import { useDebounce } from "../hooks/useDebounce";
import "./../styles.css"; // ensure styles loaded even if App.jsx forgets

// Minimal WMO code mapping
const WMO = {
  0: { label: "Clear", icon: Sun },
  1: { label: "Mainly Clear", icon: Sun },
  2: { label: "Partly Cloudy", icon: CloudSun },
  3: { label: "Overcast", icon: Cloud },
  45: { label: "Fog", icon: Cloud },
  48: { label: "Rime Fog", icon: Cloud },
  51: { label: "Light Drizzle", icon: CloudDrizzle },
  53: { label: "Drizzle", icon: CloudDrizzle },
  55: { label: "Heavy Drizzle", icon: CloudDrizzle },
  61: { label: "Light Rain", icon: CloudRainWind },
  63: { label: "Rain", icon: CloudRainWind },
  65: { label: "Heavy Rain", icon: CloudRainWind },
  71: { label: "Light Snow", icon: Snowflake },
  73: { label: "Snow", icon: Snowflake },
  75: { label: "Heavy Snow", icon: Snowflake },
  80: { label: "Rain Showers", icon: CloudRainWind },
  95: { label: "Thunderstorm", icon: CloudLightning },
};
const codeInfo = (code) => WMO[code] ?? { label: "Partly Cloudy", icon: CloudSun };

const formatHour = (d) => d.toLocaleTimeString([], { hour: "numeric" });
const formatWeekday = (d) => d.toLocaleDateString([], { weekday: "short" });

const Chip = ({ active, children, onClick }) => (
  <button className={`chip ${active ? "active" : ""}`} onClick={onClick}>{children}</button>
);

const Stat = ({ label, value, icon }) => (
  <div className="stat">
    {icon}
    <div>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  </div>
);

export default function WeatherApp(){
  const [unit, setUnit] = useState(localStorage.getItem("unit") || "C");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(
    () => JSON.parse(localStorage.getItem("selected") || "null") || { name: "Toronto", country: "CA", lat: 43.6532, lon: -79.3832 }
  );
  const [wx, setWx] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const debounced = useDebounce(query, 350);

  // Search cities
  useEffect(() => {
    let cancel = false;
    async function run(){
      if (!debounced.trim()) { setResults([]); return; }
      setSearching(true);
      try {
        const list = await searchCities(debounced, 8);
        if (!cancel) setResults(list);
      } catch {
        if (!cancel) setResults([]);
      } finally {
        if (!cancel) setSearching(false);
      }
    }
    run();
    return () => { cancel = true; };
  }, [debounced]);

  // Fetch weather on city or unit change
  useEffect(() => {
    if (!selected) return;
    let cancel = false;
    async function load(){
      setLoading(true); setError("");
      try {
        const data = await fetchWeather({ lat: selected.lat, lon: selected.lon, unit });
        const a = await fetchAirQuality({ lat: selected.lat, lon: selected.lon });
        if (!cancel) { setWx(data); setAqi(a); }
      } catch (e) {
        if (!cancel) setError("Failed to load weather data.");
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    localStorage.setItem("selected", JSON.stringify(selected));
    localStorage.setItem("unit", unit);
    return () => { cancel = true; };
  }, [selected, unit]);

  const ConditionIcon = useMemo(() => (wx ? (codeInfo(wx.current?.code).icon || CloudSun) : CloudSun), [wx]);
  const conditionLabel = wx ? codeInfo(wx.current?.code).label : "—";

  const hourlyChart = (wx?.hours || []).slice(0, 24).map((h) => ({
    name: formatHour(h.time),
    temp: Math.round(h.temp * 10) / 10,
  }));

  return (
    <div>
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="brand">
            <div className="brand-badge">W</div>
            <div>
              <div style={{fontSize:18,fontWeight:600}}>Weather</div>
              <div className="brand-sub">Global search • Live data</div>
            </div>
          </div>

          <div className="header-actions">
            <div className="search-wrap">
              <div className="search-input">
                <SearchIcon size={16} color="#6b7280" />
                <input
                  value={query}
                  onChange={(e)=>setQuery(e.target.value)}
                  placeholder="Search any city..."
                />
              </div>
              {(query || searching) && (
                <div className="search-menu">
                  {searching && <div className="search-empty">Searching…</div>}
                  {!searching && results.length === 0 && (
                    <div className="search-empty">No matches</div>
                  )}
                  {!searching && results.map(c=>(
                    <button
                      key={`${c.id}-${c.lat}-${c.lon}`}
                      className="search-item"
                      onClick={()=>{ setSelected(c); setQuery(""); setResults([]); }}
                    >
                      <MapPin size={16} />
                      <span style={{fontSize:14}}>
                        {c.name}{c.admin1 ? `, ${c.admin1}` : ""}, {c.country}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="chips">
              <Chip active={unit==="C"} onClick={()=>setUnit("C")}>°C</Chip>
              <Chip active={unit==="F"} onClick={()=>setUnit("F")}>°F</Chip>
            </div>
          </div>
        </div>

        {/* Alert (error) */}
        {error && (
          <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} className="alert">
            <TriangleAlert size={18} style={{marginTop:2}} />
            <div style={{fontSize:14}}>
              <div style={{fontWeight:600}}>Data Error</div>
              <div>{error}</div>
            </div>
          </motion.div>
        )}

        {/* Grid */}
        <div className="grid">
          {/* Left card */}
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.05}} className="card pad col-7">
            <div className="hero-top">
              <div>
                <div className="hero-loc"><MapPin size={16} /> {selected ? `${selected.name}${selected.admin1 ? `, ${selected.admin1}` : ""}, ${selected.country}` : "—"}</div>
                <div className="hero-temp">
                  {loading || !wx ? "—" : Math.round(wx.current?.temp)}°{unit}
                </div>
                <div className="hero-cond">
                  <ConditionIcon />
                  <span>{conditionLabel}</span>
                </div>
                <div className="stats">
                  <Stat label="Feels like" value={loading||!wx ? "—" : `${Math.round(wx.current?.feels)}°${unit}`} icon={<Thermometer size={16} />} />
                  <Stat label="Wind" value={loading||!wx ? "—" : `${Math.round(wx.current?.wind)} km/h`} icon={<Wind size={16} />} />
                  <Stat label="Humidity" value={loading||!wx ? "—" : `${Math.round(wx.current?.humidity)}%`} icon={<Droplets size={16} />} />
                  <Stat label="UV" value={loading||!wx ? "—" : `${Math.round(wx.days?.[0]?.uv || 0)}`} icon={<SunMedium size={16} />} />
                  <Stat label="AQI" value={aqi == null ? "—" : `${aqi}`} icon={<CloudSun size={16} />} />
                  <Stat
                    label="Sunrise/Sunset"
                    value={
                      loading||!wx
                        ? "—"
                        : `${new Date(wx.days?.[0]?.sunrise).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} / ${new Date(wx.days?.[0]?.sunset).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    }
                    icon={<Moon size={16} />}
                  />
                </div>
              </div>

              <div className="icon-box">
                <div className="icon-bg"></div>
                <div className="icon-center"><ConditionIcon size={48} /></div>
              </div>
            </div>

            <div className="section-head">
              <div className="title">Next 24 hours</div>
              <div className="sub">Hourly temperature</div>
            </div>
            <div style={{height:160,width:"100%"}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyChart} margin={{ top:10, right:10, bottom:0, left:0 }}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize:12 }} />
                  <YAxis hide domain={["dataMin - 3", "dataMax + 3"]} />
                  <Tooltip formatter={(v)=>`${v}°${unit}`} labelFormatter={(l)=>`Hour: ${l}`} />
                  <Line type="monotone" dataKey="temp" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Right rail */}
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.1}} className="col-5" style={{display:"grid",gap:16}}>
            <div className="card pad">
              <div className="section-head">
                <div className="title">Radar (placeholder)</div>
                <div className="sub">Timezone: {wx?.tz || "—"}</div>
              </div>
              <div className="radar"><span style={{fontSize:14}}>Map coming later</span></div>
            </div>

            <div className="card pad">
              <div className="title">7-day forecast</div>
              <div className="daily">
                {(wx?.days || []).slice(0,7).map((d, idx)=>(
                  <div key={idx} className="daily-item">
                    <div className="daily-day">{idx===0 ? "Today" : formatWeekday(d.date)}</div>
                    <div className="daily-cond">
                      {React.createElement(codeInfo(d.code).icon || CloudSun, { size: 18 })}
                      <span style={{color:"#6b7280",fontSize:14}}>{codeInfo(d.code).label}</span>
                    </div>
                    <div className="daily-range">
                      <span style={{color:"#6b7280"}} className="tabular-nums">{Math.round(d.min)}°</span>
                      <div className="range-bar"><div className="range-fill" style={{width:`${Math.min(100, Math.max(8, (d.max - d.min) * 12))}%`}}/></div>
                      <span className="tabular-nums" style={{fontWeight:600}}>{Math.round(d.max)}°</span>
                    </div>
                  </div>
                ))}
                {(!wx || !wx.days) && <div className="search-empty" style={{paddingTop:8}}>—</div>}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Hourly scroller */}
        <div className="card pad" style={{marginTop:16}}>
          <div className="title" style={{marginBottom:8}}>Hourly details</div>
          <div className="h-scroll">
            {(wx?.hours || []).slice(0,24).map((h,i)=>(
              <div key={i} className="h-item">
                <div className="h-time">{formatHour(h.time)}</div>
                <div style={{marginTop:4,display:"flex",alignItems:"center",gap:8}}>
                  <CloudSun size={18}/>
                  <div style={{fontWeight:600}}>{Math.round(h.temp)}°{unit}</div>
                </div>
                <div className="h-meta">
                  <div style={{display:"flex",alignItems:"center",gap:4}}><Wind size={12}/> {Math.round(h.wind)} km/h</div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><Droplets size={12}/> {Math.round(h.humidity)}%</div>
                </div>
              </div>
            ))}
            {(!wx || !wx.hours) && <div className="h-item">—</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="footer">Live data · Type to search · Toggle °C/°F · Results saved locally</div>
      </div>
    </div>
  );
}