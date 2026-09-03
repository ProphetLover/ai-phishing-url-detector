"use client";

import { ShieldAlert, Globe, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header({ isRtl, setIsRtl }: { isRtl: boolean, setIsRtl: (val: boolean) => void }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <header className="w-full p-4 md:p-6 flex items-center justify-between z-40 relative">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-[0_0_20px_rgba(232,40,63,0.4)]">
          <ShieldAlert className="text-white" size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg md:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 dark:from-white dark:to-slate-400">
            {isRtl ? "كاشف الاحتيال الذكي" : "AI Phishing Detector"}
          </h1>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full glass hover:bg-white/10 transition-colors"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-700" />}
        </button>
        <button 
          onClick={() => setIsRtl(!isRtl)}
          className="p-2 px-4 rounded-full glass hover:bg-white/10 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Globe size={16} />
          {isRtl ? "EN" : "عربي"}
        </button>
      </div>
    </header>
  );
}
