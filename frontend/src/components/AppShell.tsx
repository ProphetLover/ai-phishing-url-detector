"use client";
import React, { useState, useEffect } from "react";
import { useGlobal } from "@/lib/store";
import { getTr, T } from "@/lib/i18n";
import { 
  ShieldCheck, LayoutDashboard, History, Info, Settings,
  Moon, Sun, Globe, Search, 
} from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { lang, setLang, theme, setTheme, activeView, setActiveView, systemName, logo, } = useGlobal();
  const tr = (key: keyof typeof T.en) => getTr(lang, key);
  
  let parsedSystemName = systemName;
  try {
    const parsed = JSON.parse(systemName);
    if (parsed && typeof parsed === 'object') {
      parsedSystemName = parsed[lang] || parsed['en'] || "PhishGuard AI";
    }
  } catch {}
  
  const displaySystemName = (parsedSystemName === "PhishGuard AI" || systemName === "PhishGuard AI") 
    ? tr("defaultSiteName") 
    : parsedSystemName;

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, title: tr("navDashboard"), sub: tr("navDashboardSub") },
    { id: "history", icon: History, title: tr("navHistory"), sub: tr("navHistorySub") },
    { id: "howItWorks", icon: Info, title: tr("navHow"), sub: tr("navHowSub") },
    { id: "settings", icon: Settings, title: tr("navSettings"), sub: tr("navSettingsSub") },
  ];

  const [isClient, setIsClient] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    
  }, [lang]);

  if (!isClient) {
    return <div className="h-screen w-screen bg-background" />;
  }

  return (
    <>
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[2px] md:h-[3px] bg-gradient-to-r from-accent-1/80 to-accent-1 z-[9999] origin-left shadow-[0_0_15px_rgba(var(--accent-1),0.8)]"
        style={{ scaleX }}
      />
      <div className="flex min-h-screen bg-background w-full relative">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-[280px] flex-col gap-6 p-6 border-r border-border sticky top-0 h-[100dvh] shrink-0 relative z-20 bg-surface-glass backdrop-blur-2xl">
        
        {/* Luxurious Logo Area */}
        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-[linear-gradient(135deg,var(--surface-elevated),transparent)] border border-border-strong relative overflow-hidden group">
          <div className="absolute inset-0 bg-accent-grad opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
          <div className="w-20 h-20 rounded-[24px] flex items-center justify-center bg-surface border-2 border-border shadow-[0_0_20px_rgba(var(--accent-1),0.2)] z-10 overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-contain rounded-[20px] p-1" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-accent-grad text-white shadow-[0_8px_24px_-8px_var(--accent-1)]">
                <ShieldCheck size={36} />
              </div>
            )}
          </div>
          <div className="flex flex-col text-center z-10">
            <span className="font-display font-bold text-[17px] tracking-wide text-text-primary text-align-dynamic">
              {displaySystemName}
            </span>
            <span className="text-[11px] text-text-muted mt-0.5 tracking-wider uppercase text-align-dynamic">{tr("brandDescriptor")}</span>
          </div>
        </div>

        <nav className="flex flex-col gap-2 relative">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as Parameters<typeof setActiveView>[0])}
              className={`relative z-10 flex items-center gap-4 px-4 py-3.5 rounded-xl text-start transition-colors ${
                activeView === item.id ? "text-text-primary" : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50"
              }`}
            >
              {activeView === item.id && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-[linear-gradient(90deg,var(--surface-elevated),transparent)] border-l-4 border-accent-1 rounded-r-xl shadow-[inset_20px_0_40px_-20px_rgba(var(--accent-1),0.1)] -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon size={20} className={activeView === item.id ? "text-accent-1" : ""} />
              <div className="flex flex-col">
                <span className={`font-bold text-[14px] leading-tight text-align-dynamic`}>{item.title}</span>
                <span className={`text-[11px] text-text-muted mt-1 text-align-dynamic`}>{item.sub}</span>
              </div>
            </button>
          ))}
        </nav>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />
        
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 lg:px-8 py-5 border-b border-border/50 bg-surface-glass backdrop-blur-xl">
          <div className="flex lg:hidden items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-surface border border-border shadow-md overflow-hidden">
               {logo ? (
                 <img src={logo} alt="Logo" className="w-full h-full object-contain p-1 rounded-2xl" />
               ) : (
                 <div className="w-full h-full bg-accent-grad text-white flex items-center justify-center">
                   <ShieldCheck size={24} />
                 </div>
               )}
            </div>
            <span className="font-display font-bold text-[16px]">{displaySystemName}</span>
          </div>

          <div className="hidden lg:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[linear-gradient(90deg,var(--safe-bg),transparent)] border border-safe/20 text-safe shadow-[0_0_20px_rgba(var(--safe),0.1)]">
            <ShieldCheck size={18} className="shrink-0" />
            <div className="flex flex-col">
              <span className="text-[12.5px] font-bold leading-tight text-align-dynamic">{tr("zeroVisit")}</span>
              <span className="text-[11px] font-medium opacity-80 text-align-dynamic">{tr("zeroVisitSub")}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 ms-auto">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border text-text-secondary hover:text-text-primary text-[13px] font-bold transition-all hover:bg-surface-elevated active:scale-95"
            >
              <Globe size={16} />
              {lang === "en" ? "AR" : "EN"}
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative w-[50px] h-[28px] rounded-full bg-surface border border-border-strong shrink-0 transition-colors shadow-inner"
              aria-label={tr("themeRowTitle")}
            >
              <div className={`absolute top-[2px] w-[22px] h-[22px] rounded-full bg-accent-grad text-white flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(.4,0,.2,1)] shadow-md ${theme === "light" ? "left-[24px]" : "left-[2px]"}`}>
                {theme === "dark" ? <Moon size={12} /> : <Sun size={12} />}
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 lg:p-8 pb-24 lg:pb-12 z-10 relative">
          <div className="animate-page-fade">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-end justify-between px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 bg-surface-glass backdrop-blur-2xl border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-border-strong" />
        
        {navItems.map((item, idx) => {
          const isActive = activeView === item.id;
          if (idx === 1) { 
            return (
              <React.Fragment key="scan-frag">
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as Parameters<typeof setActiveView>[0])}
                  className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-colors relative ${isActive ? "text-accent-1" : "text-text-muted hover:text-text-primary"}`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="mobile-morph"
                      className="absolute -top-[2px] w-12 h-[3px] bg-accent-1 rounded-full shadow-[0_0_10px_var(--accent-1)]" 
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div whileTap={{ scale: 0.9 }} animate={isActive ? { y: -2 } : { y: 0 }}>
                    <item.icon size={22} />
                  </motion.div>
                  <span className="text-[10px] font-bold mt-1 text-align-dynamic">{item.title}</span>
                </button>

                <button
                  key="scan-fab"
                  onClick={() => setActiveView("dashboard")}
                  className="relative -top-[20px] flex flex-col items-center gap-1 mx-2"
                >
                  <motion.div 
                    whileTap={{ scale: 0.92 }}
                    className="w-[60px] h-[60px] rounded-full bg-accent-grad text-white flex items-center justify-center shadow-[0_10px_30px_-5px_var(--accent-1)] border-[4px] border-background"
                  >
                    <Search size={24} />
                  </motion.div>
                </button>
              </React.Fragment>
            );
          }
          if (item.id === "dashboard") return null;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as Parameters<typeof setActiveView>[0])}
              className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-colors relative ${isActive ? "text-accent-1" : "text-text-muted hover:text-text-primary"}`}
            >
              {isActive && (
                <motion.div 
                  layoutId="mobile-morph"
                  className="absolute -top-[2px] w-12 h-[3px] bg-accent-1 rounded-full shadow-[0_0_10px_var(--accent-1)]" 
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div whileTap={{ scale: 0.9 }} animate={isActive ? { y: -2 } : { y: 0 }}>
                <item.icon size={22} />
              </motion.div>
              <span className="text-[10px] font-bold mt-1 text-align-dynamic">{item.title}</span>
            </button>
          );
        })}
      </nav>
    </div>
    </>
  );
}

