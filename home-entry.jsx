// Entrada do app.js da página inicial: "acorda" o HTML que já veio pronto
// no index.html (montado por scripts/build-home.mjs) em vez de montar do zero.
import React from "react";
import { hydrateRoot } from "react-dom/client";
import App from "./app.jsx";

hydrateRoot(document.getElementById("root"), <App />);
