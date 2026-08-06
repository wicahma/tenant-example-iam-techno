"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ITokens } from "@/types/auth.types";
import { apiGetMe } from "@/services/profile.service";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Login" },
  { href: "/me", label: "Profile" },
  { href: "/users", label: "Users" },
  { href: "/reset-password", label: "Reset Password" },
  { href: "/oauth", label: "OAuth" },
];

export const Navbar = () => {
  const [auth, setAuth] = useState<ITokens | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Check auth state via a cookie-readable approach
    apiGetMe()
      .then((data) => {
        if (data.status) {
          setAuth({
            accessToken: "***",
            refreshToken: null,
            fullName: data.data?.fullName || "",
            npk: data.data?.npk,
          });
        }
      })
      .catch(() => setAuth(null));
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-lg font-bold text-gray-900 dark:text-white"
        >
          IAM Tenant Example
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          {auth && (
            <span className="ml-4 text-xs text-gray-500 dark:text-gray-400">
              {auth.fullName || auth.npk}
            </span>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Toggle menu"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-200 px-4 pb-4 md:hidden dark:border-gray-700">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};
