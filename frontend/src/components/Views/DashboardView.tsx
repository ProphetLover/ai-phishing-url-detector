"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobal } from "@/lib/store";
import { useAnalysis } from "@/lib/useAnalysis";
import { getTr, T } from "@/lib/i18n";
import { Search, ShieldAlert, ShieldCheck, AlertTriangle, ArrowRight, Activity, Server, Check } from "lucide-react";

// --- Number Counter Component ---
const Counter = ({ value, suffix = "", decimals = false }: { value: number; suffix?: string; decimals?: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
        const duration = 1500; // 1.5s
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(value * ease);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);

  const displayValue = decimals ? count.toFixed(1) : Math.round(count).toString();
  return <span>{displayValue}{suffix}</span>;
};

export function DashboardView() {
  const { lang, setActiveView, } = useGlobal();
  const tr = (key: keyof typeof T.en) => getTr(lang, key);
  const { url, setUrl, isAnalyzing, result, setResult, analyze, error, scanStep, setScanStep } = useAnalysis();
  

  const isRtl = lang === "ar";
  const executeAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    analyze();
  };

  // Luxurious Scanning Animation State
  if (isAnalyzing) {
    const steps = [
      { id: 1, title: tr("scanStep1") },
      { id: 2, title: tr("scanStep2") },
      { id: 3, title: tr("scanStep3") },
      { id: 4, title: tr("scanStep4") },
      { id: 5, title: tr("scanStep5") }
    ];

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="w-full flex flex-col md:flex-row items-center md:items-start justify-center min-h-[60vh] gap-12 md:gap-24"
        
      >
        <div className="relative w-48 h-48 md:w-80 md:h-80 flex-shrink-0">
          <div className="absolute inset-0 border-[3px] md:border-[4px] border-border-strong rounded-full opacity-20" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute inset-0 border-[3px] md:border-[4px] border-t-accent-1 border-r-accent-1 border-b-transparent border-l-transparent rounded-full shadow-[0_0_40px_rgba(var(--accent-1),0.4)]"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
            className="absolute inset-4 border-[2px] md:border-[3px] border-t-transparent border-r-transparent border-b-accent-2 border-l-accent-2 rounded-full opacity-60"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-20 h-20 md:w-32 md:h-32 bg-accent-1/20 rounded-full blur-2xl absolute"
            />
            <Activity className="w-12 h-12 md:w-20 md:h-20 text-accent-1 animate-pulse relative z-10" />
          </div>
        </div>
        
        <div className="flex flex-col gap-6 md:gap-8 max-w-md w-full pt-4">
          <h2 className="text-3xl md:text-5xl font-black font-display tracking-tight text-center md:text-start">{tr("analysisInProgress")}</h2>
          <div className="flex flex-col gap-3 md:gap-4">
            {steps.map((step) => {
              const isActive = scanStep === step.id;
              const isPast = scanStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center gap-4">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    isActive ? "border-accent-1 bg-accent-1/10 text-accent-1 shadow-[0_0_15px_rgba(var(--accent-1),0.3)]" : 
                    isPast ? "border-safe bg-safe/10 text-safe" : 
                    "border-border-strong text-text-muted"
                  }`}>
                    {isPast ? <Check size={16} className="md:w-5 md:h-5" /> : <div className="text-[11px] md:text-sm font-bold">{step.id}</div>}
                  </div>
                  <div className={`text-[15px] md:text-lg font-bold transition-all duration-500 ${
                    isActive ? "text-text-primary" : 
                    isPast ? "text-text-secondary" : 
                    "text-text-muted"
                  }`}>
                    {step.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  // Luxurious Result State
  if (result) {
    const isPhishing = result.prediction.toLowerCase() === 'phishing';
    const conf = result.model_confidence * 100;
    const score = result.estimated_risk_score;
    const safety = 100 - score;
    
    let riskLevel = "Safe / Low Risk";
    if (score >= 25 && score < 50) { riskLevel = "Suspicious / Medium Risk"; }
    else if (score >= 50 && score < 75) { riskLevel = "High Risk"; }
    else if (score >= 75) { riskLevel = "Critical"; }

    let reasons: string[] = [];
    if (result.raw_features) {
      const f = result.raw_features as Record<string, number | boolean>;
      if (f.has_ip_address === 1) reasons.push(tr("reasonIp"));
      if (Number(f.suspicious_keyword_count) > 0) reasons.push(tr("reasonKeywords"));
      if (Number(f.url_length) > 75) reasons.push(tr("reasonLength"));
      if (Number(f.count_subdomains) > 2) reasons.push(tr("reasonSubdomains"));
      if (Number(f.hostname_entropy) > 4.0) reasons.push(tr("reasonEntropy"));
      if (Number(f.count_special_chars) > 15) reasons.push(tr("reasonSpecialChars"));
    }
    const topReasons = reasons.slice(0, 3);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl mx-auto space-y-12 pb-12"
        
      >
        <div className="flex justify-between items-center px-4">
           <button onClick={() => { setResult(null); setUrl(""); setScanStep(-1); }} className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-2">
             <ArrowRight className="w-5 h-5 rotate-180" />
             {tr("scanAnother")}
           </button>
           <button onClick={() => setActiveView("history")} className="px-6 py-2.5 rounded-full border border-border-strong hover:border-accent-1 hover:text-accent-1 transition-all text-sm font-bold bg-surface/50 backdrop-blur-sm">
             {tr("viewInHistory")}
           </button>
        </div>

        {/* Hero Result Card */}
        <div className={`relative overflow-hidden rounded-[24px] md:rounded-[40px] p-6 sm:p-10 md:p-14 border backdrop-blur-2xl mx-4 md:mx-0 ${isPhishing ? 'border-danger/40 bg-danger/5 shadow-[0_0_100px_rgba(var(--danger),0.15)]' : 'border-safe/40 bg-safe/5 shadow-[0_0_100px_rgba(var(--safe),0.15)]'}`}>
           <div className={`absolute -top-20 -right-20 md:-top-40 md:-right-40 w-64 md:w-96 h-64 md:h-96 blur-[80px] md:blur-[120px] rounded-full opacity-40 pointer-events-none ${isPhishing ? 'bg-danger' : 'bg-safe'}`} />
           
           <div className="relative z-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start">
             <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5, duration: 1 }}
                className={`w-24 h-24 md:w-40 md:h-40 rounded-[20px] md:rounded-[32px] flex items-center justify-center shrink-0 shadow-2xl backdrop-blur-xl border-2 ${isPhishing ? 'bg-danger/20 border-danger/50 text-danger' : 'bg-safe/20 border-safe/50 text-safe'}`}
             >
               {isPhishing ? <ShieldAlert className="w-12 h-12 md:w-20 md:h-20 drop-shadow-[0_0_15px_currentColor]" /> : <ShieldCheck className="w-12 h-12 md:w-20 md:h-20 drop-shadow-[0_0_15px_currentColor]" />}
             </motion.div>

             <div className="flex-1 text-center md:text-start space-y-3 md:space-y-5 w-full">
               <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`text-4xl sm:text-5xl md:text-7xl font-black font-display tracking-tighter ${isPhishing ? 'text-danger drop-shadow-[0_0_30px_rgba(var(--danger),0.5)]' : 'text-safe drop-shadow-[0_0_30px_rgba(var(--safe),0.5)]'}`}
               >
                 {isPhishing ? tr("predPhishing") : tr("predLegit")}
               </motion.h1>
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                 className="inline-block px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl bg-surface-elevated/80 border border-border-strong font-mono text-[10px] sm:text-xs md:text-sm break-all max-w-full text-text-primary/90 shadow-inner"
               >
                 {url}
               </motion.div>
             </div>
           </div>
           
           <div className="relative z-10 mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface/60 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-border-strong backdrop-blur-md w-full justify-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col items-center border-r border-border-strong">
                  <div className="text-[10px] md:text-[12px] uppercase tracking-widest text-text-muted font-bold mb-2 md:mb-3">Risk Score</div>
                  <div className="text-2xl md:text-4xl font-display font-black text-danger">
                    <Counter value={score} decimals suffix="%" />
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-col items-center md:border-r border-border-strong">
                  <div className="text-[10px] md:text-[12px] uppercase tracking-widest text-text-muted font-bold mb-2 md:mb-3">Safety Score</div>
                  <div className="text-2xl md:text-4xl font-display font-black text-safe">
                    <Counter value={safety} decimals suffix="%" />
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="flex flex-col items-center border-r border-border-strong mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0">
                  <div className="text-[10px] md:text-[12px] uppercase tracking-widest text-text-muted font-bold mb-2 md:mb-3">Risk Level</div>
                  <div className={`text-sm md:text-xl font-display font-black text-center px-2 ${score >= 50 ? 'text-danger' : 'text-safe'}`}>
                    {riskLevel}
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex flex-col items-center mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0">
                  <div className="text-[10px] md:text-[12px] uppercase tracking-widest text-text-muted font-bold mb-2 md:mb-3">{tr("aiConfidence")}</div>
                  <div className="text-2xl md:text-4xl font-display font-black text-text-primary">
                    <Counter value={conf} decimals suffix="%" />
                  </div>
                </motion.div>
           </div>
        </div>

        {/* Human Readable Explanation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-surface/50 border border-border/50 rounded-3xl p-6 md:p-8 backdrop-blur-xl mb-8 text-start"
        >
          <h3 className="text-xl md:text-2xl font-bold font-display flex items-center gap-3 mb-4 text-text-primary">
            <Activity className="text-accent-1 w-6 h-6" />
            {isPhishing ? tr("whySuspicious") : tr("whySafe")}
          </h3>
          
          <div className="text-sm md:text-[15px] text-text-secondary leading-relaxed mb-6 font-medium">
            {isPhishing 
              ? tr("explanationSuspiciousBase")
              : tr("explanationSafe")}
          </div>

          {isPhishing && topReasons.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-widest text-text-muted font-bold mb-3">{tr("keyIndicators")}</div>
              <ul className="space-y-3">
                {topReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 min-w-[16px] flex justify-center text-danger">
                      <AlertTriangle size={16} />
                    </div>
                    <span className="text-[14px] text-text-secondary font-medium">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* Technical Analysis Grid */}
        {result.raw_features && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="space-y-6 px-2"
          >
            <h3 className="text-3xl font-bold font-display flex items-center gap-4">
              <Activity className="text-accent-1 w-8 h-8" />
              {tr("featureAnalysis")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Object.entries(result.raw_features).map(([key, value]: [string, number | boolean], idx: number) => {
                  const i18nKey = `f_${key}` as keyof typeof T.en;
                  const displayName = T.en[i18nKey] ? tr(i18nKey) : key.replace(/_/g, ' ');
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + (idx * 0.05), type: "spring" }}
                      key={`${key}-${idx}`} 
                      className="p-6 rounded-[28px] bg-surface-elevated/60 backdrop-blur-xl border border-border hover:border-accent-1/50 hover:bg-surface-elevated hover:shadow-[0_10px_40px_-10px_rgba(var(--accent-1),0.2)] transition-all flex items-center gap-5 group cursor-default"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-surface border border-border-strong flex items-center justify-center text-text-muted group-hover:text-accent-1 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(var(--accent-1),0.3)] transition-all duration-300">
                        <Activity size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-bold text-text-primary mb-1.5 capitalize truncate">{displayName}</div>
                        <div className="text-[13px] text-text-muted font-mono truncate">{String(value)}</div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Luxurious Initial Dashboard State
  return (
    <div className="w-full min-h-[75vh] flex flex-col items-center justify-center relative overflow-hidden" >
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-accent-1/10 rounded-full blur-[100px] md:blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 right-1/4 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-accent-2/10 rounded-full blur-[120px] md:blur-[180px] pointer-events-none mix-blend-screen" />

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-center space-y-6 md:space-y-8 max-w-5xl z-10 w-full px-4 sm:px-6"
      >
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black font-display tracking-tight md:tracking-tighter leading-[1.1] md:leading-[1.05]">
          {tr("heroTitleA")} <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-1 via-accent-2 to-accent-1 bg-[length:200%_auto] animate-[gradient_4s_linear_infinite] drop-shadow-sm block mt-1 md:mt-0">
            {tr("heroTitleB")}
          </span>
        </h1>
        
        <p className="text-sm sm:text-lg md:text-2xl text-text-muted max-w-3xl mx-auto leading-relaxed font-medium px-2">
          {tr("heroSub")}
        </p>

        <form onSubmit={executeAnalysis} className="mt-8 md:mt-16 w-full max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 md:-inset-2 bg-gradient-to-r from-accent-1 to-accent-2 rounded-[24px] md:rounded-[40px] blur-lg md:blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-focus-within:opacity-60 group-focus-within:duration-300" />
          <div className="relative flex flex-col md:flex-row items-stretch md:items-center p-2 md:p-3 rounded-[24px] md:rounded-[40px] bg-surface/80 backdrop-blur-3xl border border-border shadow-2xl gap-2 md:gap-0">
             <div className="hidden md:block ps-8 pe-6 text-text-muted group-focus-within:text-accent-1 transition-colors duration-300">
               <Search size={32} />
             </div>
             <div className="flex items-center md:hidden px-4 pt-3 pb-1 text-accent-1">
               <Search size={20} />
             </div>
             <input
               type="text"
               value={url}
               onChange={(e) => setUrl(e.target.value)}
               placeholder={tr("inputPlaceholder")}
               className="flex-1 min-w-0 bg-transparent outline-none px-4 md:px-0 py-3 md:py-6 text-base md:text-2xl text-text-primary placeholder:text-text-muted/50 font-medium w-full text-center md:text-start"
             />
             <button
               type="submit"
               className="w-full md:w-auto h-full px-6 py-4 md:px-12 md:py-6 rounded-[18px] md:rounded-[28px] bg-gradient-to-r from-accent-1 to-accent-2 text-white font-bold text-base md:text-xl shadow-[0_0_20px_rgba(var(--accent-1),0.4)] md:shadow-[0_0_40px_rgba(var(--accent-1),0.5)] hover:shadow-[0_0_60px_rgba(var(--accent-1),0.7)] hover:scale-[1.02] active:scale-[0.97] transition-all flex items-center justify-center gap-2 md:gap-4 mt-2 md:mt-0"
             >
               {tr("analyzeBtn")}
               <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
             </button>
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 16 }} 
                exit={{ opacity: 0, y: -10 }} 
                className="absolute left-0 right-0 mx-auto w-[90%] md:w-max px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl bg-danger/10 border border-danger/30 text-danger backdrop-blur-xl flex items-center justify-center gap-2 md:gap-3 font-bold shadow-[0_10px_30px_rgba(var(--danger),0.2)] text-sm md:text-lg z-20"
              >
                <AlertTriangle size={18} className="shrink-0" />
                <span className="text-center">{tr(error as keyof typeof T.en)}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div className="pt-8 md:pt-12 flex flex-wrap justify-center items-center gap-4 md:gap-10 text-[10px] md:text-sm font-bold text-text-muted/80 uppercase tracking-widest px-4">
           <div className="flex items-center gap-2 md:gap-3"><ShieldCheck size={16} className="text-safe/80 md:w-5 md:h-5" /> {tr("trustStatic")}</div>
           <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-border-strong hidden sm:block" />
           <div className="flex items-center gap-2 md:gap-3"><Server size={16} className="text-accent-1/80 md:w-5 md:h-5" /> {tr("trustMax")}</div>
        </div>
      </motion.div>
    </div>
  );
}

