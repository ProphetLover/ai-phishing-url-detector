"use client";
import React from "react";
import { useGlobal } from "@/lib/store";
import { getTr, T } from "@/lib/i18n";
import { ShieldCheck, TextSelect, ScanLine, BrainCircuit, Activity, BarChart3 } from "lucide-react";

export function HowItWorksView() {
  const { lang } = useGlobal();
  const tr = (key: keyof typeof T.en) => getTr(lang, key);

  return (
    <div className="flex flex-col gap-10 max-w-4xl mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">{tr("howTitle")}</h1>
        <p className="text-text-secondary text-[14.5px] leading-relaxed">{tr("howSub")}</p>
      </div>

      <div className="flex items-start gap-4 p-5 md:p-6 rounded-2xl bg-[linear-gradient(135deg,var(--safe-bg),transparent)] border border-safe/30">
        <ShieldCheck size={28} className="text-safe shrink-0" />
        <div>
          <h4 className="text-[15px] font-bold text-safe mb-1">{tr("zvBannerTitle")}</h4>
          <p className="text-[13px] text-text-secondary leading-relaxed">{tr("zvBannerBody")}</p>
        </div>
      </div>

      <div className="glass-panel p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-1/5 rounded-full blur-3xl -z-10" />
        
        <h3 className="text-xl font-bold mb-8 text-center">{tr("pipeTitle")}</h3>
        
        <div className="flex flex-col gap-0 max-w-xl mx-auto relative">
          {[
            { icon: TextSelect, title: tr("p1t"), desc: tr("p1d") },
            { icon: ScanLine, title: tr("p2t"), desc: tr("p2d") },
            { icon: Activity, title: tr("p3t"), desc: tr("p3d") },
            { icon: BrainCircuit, title: tr("p4t"), desc: tr("p4d") },
            { icon: BarChart3, title: tr("p5t"), desc: tr("p5d") },
            { icon: ShieldCheck, title: tr("p6t"), desc: tr("p6d") },
          ].map((step, idx, arr) => (
            <div key={idx} className="flex gap-6 relative pb-10 last:pb-0">
              {idx !== arr.length - 1 && (
                <div className={`absolute top-12 bottom-0 w-[2px] bg-[linear-gradient(to_bottom,var(--accent-1),var(--border))] ${lang === 'ar' ? 'right-[23px]' : 'left-[23px]'}`} />
              )}
              <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-accent-1 shrink-0 z-10 shadow-sm">
                <step.icon size={22} />
              </div>
              <div className="pt-2">
                <h4 className="text-[15px] font-bold mb-1.5">{step.title}</h4>
                <p className="text-[13px] text-text-secondary leading-relaxed max-w-[420px]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: tr("a1t"), desc: tr("a1d") },
          { title: tr("a2t"), desc: tr("a2d") },
          { title: tr("a3t"), desc: tr("a3d") }
        ].map((aud, idx) => (
          <div key={idx} className="glass-panel p-6">
            <h4 className="text-[14.5px] font-bold mb-2">{aud.title}</h4>
            <p className="text-[13px] text-text-muted leading-relaxed">{aud.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
