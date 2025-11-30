import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

const container = document.getElementById("root");
if (!container) throw new Error('Root element "#root" not found in index.html');

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
