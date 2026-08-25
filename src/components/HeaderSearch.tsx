"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";

export function HeaderSearch() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <>
      {/* Desktop inline search */}
      <div className="hidden min-w-0 flex-1 md:block md:max-w-xs lg:max-w-sm xl:max-w-md">
        <SearchBar variant="header" />
      </div>

      {/* Mobile toggle */}
      <div className="md:hidden" ref={panelRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-white/5 hover:text-white"
          aria-label={t("search")}
          aria-expanded={open}
        >
          {open ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </button>

        {open ? (
          <div className="absolute inset-x-0 top-full border-b border-white/5 bg-zinc-950/95 px-4 py-3 backdrop-blur-xl">
            <SearchBar variant="header" autoFocus onClose={() => setOpen(false)} />
          </div>
        ) : null}
      </div>
    </>
  );
}
