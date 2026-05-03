"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  change?: number;
  suffix?: string;
  className?: string;
}

export function KPICard({ label, value, icon: Icon, change, suffix, className }: KPICardProps) {
  return (
    <div className={cn("rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-3">{label}</p>
          <p className="mt-1 text-xl font-bold text-text">{value}{suffix && <span className="text-sm font-normal text-text-3 ml-1">{suffix}</span>}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-kfm-sm bg-kfm-secondary/10">
          <Icon className="h-5 w-5 text-kfm-secondary" />
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          {change > 0 ? (
            <>
              <TrendingUp className="h-3 w-3 text-kfm-success" />
              <span className="text-xs font-medium text-kfm-success">+{change}%</span>
            </>
          ) : change < 0 ? (
            <>
              <TrendingDown className="h-3 w-3 text-kfm-danger" />
              <span className="text-xs font-medium text-kfm-danger">{change}%</span>
            </>
          ) : (
            <>
              <Minus className="h-3 w-3 text-text-3" />
              <span className="text-xs font-medium text-text-3">0%</span>
            </>
          )}
          <span className="text-[10px] text-text-3 ml-1">vs periode prec.</span>
        </div>
      )}
    </div>
  );
}

interface KPIRowProps {
  children: React.ReactNode;
}

export function KPIRow({ children }: KPIRowProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  );
}
