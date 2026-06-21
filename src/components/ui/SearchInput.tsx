"use client";

import { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  getSearchHistory,
  addSearchTerm,
  removeSearchTerm,
} from "@/lib/search-history";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  placeholder?: string;
}

export default function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Cari…",
}: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, [focused]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q) {
      addSearchTerm(q);
      onSubmit(q);
      setFocused(false);
    }
  }

  function handleHistoryClick(term: string) {
    onChange(term);
    addSearchTerm(term);
    onSubmit(term);
    setFocused(false);
  }

  function handleRemoveTerm(term: string, e: React.MouseEvent) {
    e.stopPropagation();
    removeSearchTerm(term);
    setHistory(getSearchHistory());
  }

  const showHistory = focused && !value && history.length > 0;

  return (
    <div ref={containerRef} className="relative max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={placeholder}
            aria-label="Search"
            className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-4 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
          />
        </div>
      </form>

      {showHistory && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-white/[0.08] bg-[#111] p-1 shadow-2xl">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">
              Recent
            </span>
          </div>
          {history.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleHistoryClick(term)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-white/60 hover:bg-white/[0.05] hover:text-white"
            >
              <span className="flex items-center gap-2">
                <MagnifyingGlassIcon className="h-3.5 w-3.5 text-white/20" />
                {term}
              </span>
              <button
                type="button"
                onClick={(e) => handleRemoveTerm(term, e)}
                className="rounded p-0.5 text-white/20 hover:text-white/60"
                aria-label={`Remove ${term}`}
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
