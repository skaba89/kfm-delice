"use client";

import React from "react";
import Link from "next/link";
import { ChefHat } from "lucide-react";

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-kfm-border bg-surface/95 px-4 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-kfm-sm bg-kfm-secondary text-white">
            <ChefHat className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-text">KFM Delice</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs font-medium text-text-3 hover:text-text transition"
          >
            Accueil
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
