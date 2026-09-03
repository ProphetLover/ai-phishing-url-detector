"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Search, History, BarChart3,  } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { id: "/", label_en: "Dashboard", label_ar: "الرئيسية", icon: LayoutDashboard },
  { id: "/analyze", label_en: "Analyze", label_ar: "فحص رابط", icon: Search },
  { id: "/history", label_en: "History", label_ar: "السجل", icon: History },
  { id: "/analytics", label_en: "Analytics", label_ar: "الإحصائيات", icon: BarChart3 },
];

export default function NavigationTabs({ isRtl }: { isRtl: boolean }) {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 w-full md:bottom-auto md:top-6 md:w-auto md:left-1/2 md:-translate-x-1/2 z-50 px-4 pb-4 md:px-0 md:pb-0">
      <div className="flex items-center justify-between md:justify-center p-2 rounded-2xl glass shadow-2xl overflow-hidden mx-auto max-w-md">
        {tabs.map((tab) => {
          const isActive = pathname === tab.id;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.id}
              className={`relative flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-16 rounded-xl transition-colors ${
                isActive ? "text-red-500" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-red-500/10 border-b-2 border-red-500 shadow-[0_0_15px_rgba(232,40,63,0.3)] rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon size={22} className="relative z-10 mb-1" />
              <span className="relative z-10 text-[10px] font-medium tracking-wide">
                {isRtl ? tab.label_ar : tab.label_en}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
