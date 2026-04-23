import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import siteLogo from "./assets/logo2.png";
import "./index.css";
import { initDocumentTheme } from "./lib/theme";
import { router } from "./router";

initDocumentTheme();

function setBrandingFaviconLink(rel: "icon" | "apple-touch-icon", href: string, sizes?: string) {
  const sel = `link[rel="${rel}"][data-mcfit-branding]`;
  let el = document.querySelector(sel) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    el.setAttribute("data-mcfit-branding", "1");
    el.type = "image/png";
    document.head.appendChild(el);
  }
  if (sizes) {
    el.setAttribute("sizes", sizes);
  } else {
    el.removeAttribute("sizes");
  }
  el.href = href;
}

setBrandingFaviconLink("icon", siteLogo);
setBrandingFaviconLink("apple-touch-icon", siteLogo, "180x180");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
