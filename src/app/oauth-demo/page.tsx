"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { useOAuth } from "@/hooks/useOAuth";

export default function OAuthDemoPage() {
  const router = useRouter();
  const { state, loading, fetchDiscovery, initiateAuthorize } = useOAuth();

  const [clientId, setClientId] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [scope, setScope] = useState("openid profile email");

  useEffect(() => {
    fetchDiscovery();
  }, [fetchDiscovery]);

  const handleAuthorize = async () => {
    // For full redirect flow, we need to redirect the browser directly
    // to the backend's authorize endpoint (not through our proxy which handles 302)
    const pkce = await import("@/utils/pkce.util");
    const codeVerifier = pkce.generateCodeVerifier();
    const codeChallenge = await pkce.generateCodeChallenge(codeVerifier);
    const oauthState = pkce.generateState();

    sessionStorage.setItem(
      "oauth_pkce",
      JSON.stringify({
        codeVerifier,
        state: oauthState,
        redirectUri,
        clientId,
      }),
    );

    const envUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const baseUrl = envUrl || window.location.origin;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: `${window.location.origin}/oauth-demo/callback`,
      scope,
      state: oauthState,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    // Redirect browser directly to the IAM backend authorize endpoint
    // (The backend will 302 redirect to the login page)
    window.location.href = `${baseUrl}/oauth/authorize?${params.toString()}`;
  };

  // Simulated flow option (non-redirect)
  const handleSimulatedAuthorize = async () => {
    const result = await initiateAuthorize({ clientId, redirectUri, scope });
    if (result) {
      window.open(result, "_blank");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-6">
      <Card
        title="OAuth 2.0 / OpenID Connect Demo"
        description="Full Authorization Code Flow with PKCE (S256)."
      >
        {loading && !state.discovery ? (
          <PageSpinner message="Loading discovery config..." />
        ) : (
          <div className="space-y-6">
            {/* Discovery Config */}
            {state.discovery && (
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <h4 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
                  Discovery Config (/.well-known/openid-configuration)
                </h4>
                <dl className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                  {[
                    ["Issuer", state.discovery.issuer],
                    ["Auth Endpoint", state.discovery.authorizationEndpoint],
                    ["Token Endpoint", state.discovery.tokenEndpoint],
                    ["UserInfo Endpoint", state.discovery.userinfoEndpoint],
                    ["Scopes", state.discovery.scopesSupported?.join(", ")],
                    [
                      "Grant Types",
                      state.discovery.grantTypesSupported?.join(", "),
                    ],
                    [
                      "PKCE Methods",
                      state.discovery.codeChallengeMethodsSupported?.join(", "),
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-gray-500">{label}</dt>
                      <dd className="truncate font-mono text-xs text-gray-900 dark:text-gray-100">
                        {String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Authorize Form */}
            <div className="flex flex-col gap-4">
              <FormField
                label="Client ID (tenant_identifier)"
                name="clientId"
                value={clientId}
                onChange={setClientId}
                placeholder="your-tenant-identifier"
                required
              />

              <FormField
                label="Redirect URI"
                name="redirectUri"
                value={redirectUri}
                onChange={setRedirectUri}
                placeholder="https://your-app.com/callback"
                helperText="Must match a whitelisted URI in tenant config"
              />

              <FormField
                label="Scope"
                name="scope"
                value={scope}
                onChange={setScope}
                placeholder="openid profile email"
              />

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleAuthorize} loading={loading}>
                  Full Redirect Flow
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSimulatedAuthorize}
                  loading={loading}
                >
                  Simulated Flow (New Tab)
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Flow Diagram */}
      <Card title="OAuth Flow Steps">
        <ol className="ml-4 list-decimal space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>
            <strong>Authorize:</strong> Redirect to{" "}
            <code>/oauth/authorize</code> with PKCE challenge
          </li>
          <li>
            <strong>Login:</strong> Backend redirects to login page with
            session_id
          </li>
          <li>
            <strong>Callback:</strong> Authorization code returned to
            redirect_uri
          </li>
          <li>
            <strong>Token Exchange:</strong> <code>POST /oauth/token</code> with
            code + code_verifier
          </li>
          <li>
            <strong>UserInfo:</strong> <code>GET /oauth/userinfo</code> with
            Bearer token
          </li>
          <li>
            <strong>Refresh:</strong> <code>POST /oauth/token</code> with
            grant_type=refresh_token
          </li>
        </ol>
      </Card>

      {/* Token/UserInfo State */}
      {(state.tokenData || state.userInfoData) && (
        <Card title="OAuth Result">
          {state.tokenData && (
            <div className="mb-4">
              <h4 className="mb-2 font-medium">Token Response</h4>
              <pre className="max-h-48 overflow-auto rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800">
                {JSON.stringify(state.tokenData, null, 2)}
              </pre>
            </div>
          )}
          {state.userInfoData && (
            <div>
              <h4 className="mb-2 font-medium">UserInfo Response</h4>
              <pre className="max-h-48 overflow-auto rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800">
                {JSON.stringify(state.userInfoData, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
