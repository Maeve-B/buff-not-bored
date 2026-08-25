"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Today", icon: "🏋️" },
  { href: "/history", label: "History", icon: "🗓️" },
  { href: "/progress", label: "Progress", icon: "📈" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <span className="text-lg font-extrabold tracking-tight text-slate-900">Buff, Not Bored</span>
          <nav className="hidden gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  pathname === item.href ? "bg-accent-50 text-accent-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button aria-label="Settings" className="rounded-full p-2 text-lg text-slate-500 hover:bg-slate-100">
            ⚙️
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4 sm:pb-10">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white sm:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-2xl items-stretch justify-around">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                pathname === item.href ? "text-accent-600" : "text-slate-500"
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
