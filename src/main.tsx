import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/plus-jakarta-sans";
import App from "./App";
import "./index.css";
import { initPwa } from "./lib/pwa";
import { initTheme } from "./lib/theme";

initTheme();
initPwa();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
