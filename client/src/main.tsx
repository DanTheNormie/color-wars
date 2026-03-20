import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "pixi.js/events";
import App from "./App.tsx";
import Toaster from "@components/Toast/toaster.tsx";
import { TooltipProvider } from "@/components/ui/tooltip"
import { bootstrapGame } from "./lib/managers/gameBootstrap";

bootstrapGame();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TooltipProvider>
      <App />
      <Toaster />
    </TooltipProvider>
  </React.StrictMode>,
);
