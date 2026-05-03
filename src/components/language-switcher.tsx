"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const t = useTranslations("language");
  const currentLocale = useLocale();

  function handleSwitch(locale: string) {
    document.cookie = `kfm-locale=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t("switch")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleSwitch("fr")}
          className={currentLocale === "fr" ? "bg-accent" : ""}
        >
          🇫🇷 {t("fr")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSwitch("en")}
          className={currentLocale === "en" ? "bg-accent" : ""}
        >
          🇬🇧 {t("en")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
