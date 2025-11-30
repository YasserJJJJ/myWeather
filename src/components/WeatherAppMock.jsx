import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CloudSun, MapPin, Search as SearchIcon, Wind, Droplets,
  SunMedium, Moon, Thermometer, TriangleAlert,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

const formatHour = (d) => d.toLocaleTimeString([], { hour: "numeric" });
const formatWeekday = (d) => d.toLocaleDateString([], { weekday: "short" });
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const cToF = (c) => (c * 9) / 5 + 32;
const ConditionIcon = ({ size = 24 }) => <CloudSun size={size} />;

function buildMockData() {
  const base = new Date();
  base.setMinutes(0, 0, 0);

  const hours = Array.from({ length: 24 }).map((_, i) => {
    const d = new Date(base);
    d.setHours(base.getHours() + i);
    const t = 17 + 6 * Math.sin(((i - 7) / 24) * Math.PI * 2);
    const humidity = clamp(45 + 20 * Math.sin(((i + 3) / 24) * Math.PI * 2), 25, 95);
    const wind = clamp(8 + 4 * Math.sin(((i + 9) / 24) * Math.PI * 2), 2, 22);
    return { time: d, tempC: Math.round(t * 10) / 10, humidity: Math.round(humidity), wind: Math.round(wind) };
  });

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const max = 22 + 4 * Math.sin(((i + 1) / 7) * Math.PI * 2);
    const min = max - clamp(6 + 2 * Math.sin(((i + 4) / 7) * Math.PI * 2), 4, 8);
    const uv = clamp(2 + i, 1, 10);
    return { date: d, minC: Math.round(min), maxC: Math.round(max), uv };
  });

  const aqi = 48;
  const alerts = [{ id: "sm-heat", severity: "Advisory", title: "UV index high 1–4pm", body: "Limit direct sun exposure; wear SPF 30+." }];
  return { hours, days, aqi, alerts };
}

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

export default function WeatherAppMock(){
  const [unit, setUnit] = useState("C");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Toronto, CA");
  const { hours, days, aqi, alerts } = useMemo(() => buildMockData(), []);

  const current = hours[0];
  const temp = unit === "C" ? current.tempC : cToF(current.tempC);
  const hourlyChart = hours.map(h => ({ name: formatHour(h.time), temp: unit === "C" ? h.tempC : Math.round(cToF(h.tempC)*10)/10 }));

  const filteredLocations = useMemo(() => {
    const base = ["Toronto, CA","New York, US","London, UK","Tokyo, JP","Sydney, AU","Berlin, DE"];
    return base.filter(c => c.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  return (
    <div>
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="brand">
            <div className="brand-badge">W</div>
            <div>
              <div style={{fontSize:18,fontWeight:600}}>Weather</div>
              <div className="brand-sub">Interactive UI mockup • no API</div>
            </div>
          </div>

          <div className="header-actions">
            <div className="search-wrap">
              <div className="search-input">
                <SearchIcon size={16} color="#6b7280" />
                <input
                  value={query}
                  onChange={(e)=>setQuery(e.target.value)}
                  placeholder="Search city..."
                />
              </div>
              {query && (
                <div className="search-menu">
                  {filteredLocations.length === 0 && <div className="search-empty">No matches</div>}
                  {filteredLocations.map(c=>(
                    <button key={c} className="search-item" onClick={()=>{ setCity(c); setQuery(""); }}>
                      <MapPin size={16} />
                      <span style={{fontSize:14}}>{c}</span>
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

        {/* Alert */}
        {alerts.length>0 && (
          <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} className="alert">
            <TriangleAlert size={18} style={{marginTop:2}} />
            <div style={{fontSize:14}}>
              <div style={{fontWeight:600}}>
                {alerts[0].title} · {alerts[0].severity}
              </div>
              <div>{alerts[0].body}</div>
            </div>
          </motion.div>
        )}

        {/* Grid */}
        <div className="grid">
          {/* Left card */}
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.05}} className="card pad col-7">
            <div className="hero-top">
              <div>
                <div className="hero-loc"><MapPin size={16} /> {city}</div>
                <div className="hero-temp">{Math.round(temp)}°{unit}</div>
                <div className="hero-cond"><ConditionIcon /><span>Partly Cloudy</span></div>
                <div className="stats">
                  <Stat label="Feels like" value={`${Math.round(temp - 1)}°${unit}`} icon={<Thermometer size={16} />} />
                  <Stat label="Wind" value={`${current.wind} km/h`} icon={<Wind size={16} />} />
                  <Stat label="Humidity" value={`${current.humidity}%`} icon={<Droplets size={16} />} />
                  <Stat label="UV" value={`${days[0].uv}`} icon={<SunMedium size={16} />} />
                  <Stat label="AQI" value={`${aqi} • Good`} icon={<CloudSun size={16} />} />
                  <Stat label="Sunrise/Sunset" value={`7:13 / 16:43`} icon={<Moon size={16} />} />
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
                <div className="sub">Last updated just now</div>
              </div>
              <div className="radar"><span style={{fontSize:14}}>Interactive map coming later</span></div>
            </div>

            <div className="card pad">
              <div className="title">7-day forecast</div>
              <div className="daily">
                {days.map((d, idx)=>(
                  <div key={idx} className="daily-item">
                    <div className="daily-day">{idx===0 ? "Today" : formatWeekday(d.date)}</div>
                    <div className="daily-cond"><ConditionIcon size={18}/><span style={{color:"#6b7280",fontSize:14}}>Partly Cloudy</span></div>
                    <div className="daily-range">
                      <span style={{color:"#6b7280"}} className="tabular-nums">{Math.round(unit==="C"? d.minC : cToF(d.minC))}°</span>
                      <div className="range-bar"><div className="range-fill" style={{width:`${clamp((d.maxC-d.minC)*12,8,100)}%`}}/></div>
                      <span className="tabular-nums" style={{fontWeight:600}}>{Math.round(unit==="C"? d.maxC : cToF(d.maxC))}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Hourly scroller */}
        <div className="card pad" style={{marginTop:16}}>
          <div className="title" style={{marginBottom:8}}>Hourly details</div>
          <div className="h-scroll">
            {hours.map((h,i)=>(
              <div key={i} className="h-item">
                <div className="h-time">{formatHour(h.time)}</div>
                <div style={{marginTop:4,display:"flex",alignItems:"center",gap:8}}>
                  <ConditionIcon size={18}/>
                  <div style={{fontWeight:600}}>
                    {Math.round(unit==="C"? h.tempC : cToF(h.tempC))}°{unit}
                  </div>
                </div>
                <div className="h-meta">
                  <div style={{display:"flex",alignItems:"center",gap:4}}><Wind size={12}/> {h.wind} km/h</div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><Droplets size={12}/> {h.humidity}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="footer">Prototype UI · Type to search · Toggle °C/°F · No network calls</div>
      </div>
    </div>
  );
}
