"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

interface HealthStatus {
  status: string;
  message: string;
  timestamp: string;
}

const endpointCards = [
  {
    title: "Manual Login",
    href: "/login",
    desc: "Password-based tenant login with username source selection and pre-token mode.",
    method: "POST",
    path: "/public/manual/login",
  },
  {
    title: "User Profile",
    href: "/me",
    desc: "View and update user profile. Change password.",
    method: "GET/PUT",
    path: "/public/me",
  },
  {
    title: "User List",
    href: "/users",
    desc: "Paginated user list with search and active status filter.",
    method: "GET",
    path: "/public/users",
  },
  {
    title: "Reset Password",
    href: "/reset-password",
    desc: "Full reset flow: send → validate OTP → set new password. Supports email, SMS, and email-OTP.",
    method: "POST",
    path: "/public/reset-password",
  },
  {
    title: "OAuth 2.0 / OIDC",
    href: "/oauth-demo",
    desc: "Authorization code flow with PKCE. Discovery, token exchange, userinfo, and revoke.",
    method: "GET/POST",
    path: "/oauth/*",
  },
];

export default function HomePage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        setHealth(d);
        setHealthLoading(false);
      })
      .catch(() => setHealthLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          IAM Techno Tenant Example
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Reference implementation for integrating with the IAM Techno Public
          API. All 19 endpoints covered with production-quality UI.
        </p>

        {/* Health status */}
        <div className="mt-6 flex justify-center">
          {healthLoading ? (
            <Spinner size="sm" />
          ) : health ? (
            <Badge variant={health.status === "healthy" ? "success" : "danger"}>
              API: {health.status === "healthy" ? "Connected" : "Unreachable"}
            </Badge>
          ) : (
            <Badge variant="warning">API: Unknown</Badge>
          )}
        </div>
      </div>

      {/* Endpoint cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {endpointCards.map((card) => (
          <Link key={card.href} href={card.href} className="group">
            <Card className="h-full transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                  {card.title}
                </h3>
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {card.method}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {card.desc}
              </p>
              <code className="mt-3 block text-xs text-blue-600 dark:text-blue-400">
                {card.path}
              </code>
            </Card>
          </Link>
        ))}
      </div>

      {/* API Coverage */}
      <Card className="mt-8" title="Full API Coverage">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "GET /public/health",
            "POST /public/manual/login",
            "POST /public/pre-token/claims",
            "POST /public/oauth/login",
            "POST /public/logout",
            "POST /public/me/refresh-token",
            "POST /public/validate-token",
            "GET /public/me",
            "GET /public/me/profile",
            "PUT /public/me",
            "GET /public/users",
            "POST /public/me/change-password",
            "POST /public/reset-password",
            "POST /public/reset-password/validate",
            "POST /public/reset-password/reset",
            "GET /oauth/authorize",
            "POST /oauth/token",
            "GET /oauth/userinfo",
            "GET /.well-known/openid-configuration",
            "POST /oauth/revoke",
          ].map((ep) => (
            <div key={ep} className="flex items-center gap-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <code className="text-gray-700 dark:text-gray-300">{ep}</code>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
