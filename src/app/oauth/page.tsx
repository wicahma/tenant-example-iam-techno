"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner, Spinner } from "@/components/ui/Spinner";
import toast from "react-hot-toast";
import { useOAuth } from "@/hooks/useOAuth";
import { env } from "@/config/env.config";
import { savePkce } from "@/utils/pkceStorage";
import type {
  IOAuthTokenResponse,
  IOAuthUserInfoResponse,
} from "@/types/oauth.types";

interface PopupResult {
  tokenData: IOAuthTokenResponse;
  userInfoData: IOAuthUserInfoResponse | null;
}

export default function OAuthPage() {
  const router = useRouter();
  const { state, loading, fetchDiscovery, initiateAuthorize } = useOAuth();

  const [clientId, setClientId] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [scope, setScope] = useState("openid profile email");

  // Popup flow state
  const [opening, setOpening] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupResult, setPopupResult] = useState<PopupResult | null>(null);
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    fetchDiscovery();
    // Load the real client id (APP_IDENTIFIER) and prefill this app's callback.
    env()
      .then(({ APP }) => {
        setClientId(APP.APP_IDENTIFIER);
        if (typeof window !== "undefined") {
          setRedirectUri(`${window.location.origin}/oauth/callback`);
        }
      })
      .catch(() => {});
  }, [fetchDiscovery]);

  // Listen for the callback popup finishing (postMessage from the callback page).
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as {
        type?: string;
        payload?: PopupResult;
        error?: string;
      };
      if (data.type === "oauth:callback:complete") {
        setPopupResult(data.payload ?? null);
        setPopupOpen(false);
        toast.success("OAuth login completed in popup");
      } else if (data.type === "oauth:callback:error") {
        setPopupOpen(false);
        toast.error(data.error || "OAuth login failed");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Detect the popup being closed manually and clear the waiting overlay.
  useEffect(() => {
    if (!popupOpen) return;
    const timer = setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        popupRef.current = null;
        setPopupOpen(false);
        toast("OAuth popup was closed before completing login");
      }
    }, 500);
    return () => clearInterval(timer);
  }, [popupOpen]);

  const handleAuthorize = async () => {
    setOpening(true);
    setPopupResult(null);

    // Open the popup synchronously (during the user gesture) so popup blockers
    // don't block it, then navigate it once the PKCE params are ready.
    const popup = window.open(
      "about:blank",
      "iam_techno_oauth",
      "popup=yes,width=480,height=680,left=160,top=120,scrollbars=yes,resizable=yes",
    );

    if (!popup) {
      setOpening(false);
      toast.error(
        "Popup blocked. Please allow popups for this site and try again.",
      );
      return;
    }

    popupRef.current = popup;
    setPopupOpen(true);

    try {
      const { APP } = await env();
      const pkce = await import("@/utils/pkce.util");
      const codeVerifier = pkce.generateCodeVerifier();
      const codeChallenge = await pkce.generateCodeChallenge(codeVerifier);
      const oauthState = pkce.generateState();

      savePkce({
        codeVerifier,
        state: oauthState,
        redirectUri,
        clientId,
      });

      const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: redirectUri || `${window.location.origin}/oauth/callback`,
        scope,
        state: oauthState,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });

      console.log(
        "Opening OAuth authorize popup with params:",
        params.toString(),
      );

      popup.location.href = `${APP.API_URL}/public/oauth/authorize?${params.toString()}`;
    } catch (err) {
      console.error("Failed to start OAuth popup flow:", err);
      toast.error("Failed to start OAuth flow");
      if (!popup.closed) popup.close();
      setPopupOpen(false);
    } finally {
      setOpening(false);
    }
  };

  const closePopupOverlay = () => {
    setPopupOpen(false);
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
  };

  // Simulated flow option (non-redirect, opens a plain new tab)
  const handleSimulatedAuthorize = async () => {
    const result = await initiateAuthorize({ clientId, redirectUri, scope });
    if (result) {
      window.open(result, "_blank");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-6">
      <Card
        title="OAuth 2.0 / OpenID Connect"
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
                <Button onClick={handleAuthorize} loading={opening}>
                  {opening ? "Opening Popup..." : "Login with IAM (Popup)"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSimulatedAuthorize}
                  loading={loading}
                >
                  Simulated Flow (New Tab)
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                The full redirect flow now opens in a separate popup window
                (like “Login with Google”), so this page is never replaced. A
                loading overlay is shown until you finish logging in.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Flow Diagram */}
      <Card title="OAuth Flow Steps">
        <ol className="ml-4 list-decimal space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>
            <strong>Authorize:</strong> Redirect to{" "}
            <code>/public/oauth/authorize</code> with PKCE challenge
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
            <strong>Token Exchange:</strong>{" "}
            <code>POST /public/oauth/token</code> with code + code_verifier
          </li>
          <li>
            <strong>UserInfo:</strong> <code>GET /public/oauth/userinfo</code>{" "}
            with Bearer token
          </li>
          <li>
            <strong>Refresh:</strong> <code>POST /oauth/token</code> with
            grant_type=refresh_token
          </li>
        </ol>
      </Card>

      {/* Token/UserInfo State */}
      {(state.tokenData || state.userInfoData || popupResult) && (
        <Card
          title="OAuth Result"
          description={
            popupResult
              ? "Completed via the popup window (auto-refreshed from callback)"
              : undefined
          }
        >
          {popupResult && (
            <Badge variant="success" className="mb-4">
              Popup flow completed
            </Badge>
          )}
          {(state.tokenData || popupResult?.tokenData) && (
            <div className="mb-4">
              <h4 className="mb-2 font-medium">Token Response</h4>
              <pre className="max-h-48 overflow-auto rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800">
                {JSON.stringify(
                  popupResult?.tokenData ?? state.tokenData,
                  null,
                  2,
                )}
              </pre>
            </div>
          )}
          {(state.userInfoData || popupResult?.userInfoData) && (
            <div>
              <h4 className="mb-2 font-medium">UserInfo Response</h4>
              <pre className="max-h-48 overflow-auto rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800">
                {JSON.stringify(
                  popupResult?.userInfoData ?? state.userInfoData,
                  null,
                  2,
                )}
              </pre>
            </div>
          )}
        </Card>
      )}

      {/* Popup waiting overlay */}
      {popupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <Spinner size="lg" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Waiting for OAuth login…
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                A popup window has been opened with the login page. Complete the
                login there — this page will update automatically once you are
                done. You can close this overlay at any time.
              </p>
              <Button variant="outline" onClick={closePopupOverlay}>
                Cancel / Close Popup
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
