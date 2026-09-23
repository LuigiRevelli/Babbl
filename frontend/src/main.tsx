import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Polices servies par l'application elle-même : aucune requête vers Google
// (l'adresse IP du parent n'a pas à partir chez un tiers pour afficher du texte).
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "@fontsource-variable/instrument-sans/wght.css";
import "@fontsource-variable/instrument-sans/wght-italic.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Application installable : le service worker ne tourne qu'en production
// (en dev, il servirait d'anciens fichiers pendant qu'on code).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
