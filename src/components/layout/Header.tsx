"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { 
  Compass, 
  BookOpen, 
  Sparkles, 
  Clock, 
  Newspaper,
  Calendar, 

  Menu,
  X
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/exams", label: "Exams", icon: BookOpen },
    { href: "/schemes", label: "Schemes", icon: Sparkles },
    { href: "/upcoming", label: "Exam Calendar", icon: Calendar },
    { href: "/closing-soon", label: "Deadlines", icon: Clock },
    { href: "/notices", label: "Notices", icon: Newspaper },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-surface backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 transition-transform">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-card">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-fg">
                GovernIT
              </span>
            </div>
            <p className="hidden text-xs text-muted sm:block">
              One-Stop Government Opportunity Finder
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-base font-semibold transition-all ${
                  isActive
                    ? "bg-surface-muted text-fg"
                    : "text-muted hover:bg-surface-muted hover:text-fg"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-fg" : "text-muted"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Admin Portal & Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Accessible Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-muted shadow-card hover:bg-surface-muted"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-surface px-4 py-4 shadow-card">
          <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex h-11 items-center gap-2.5 rounded-xl px-3.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-surface-muted text-fg"
                      : "text-muted hover:bg-surface-muted hover:text-fg"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-fg" : "text-muted"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
