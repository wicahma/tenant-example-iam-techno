"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import type {
  IOAuthTokenResponse,
  IOAuthUserInfoResponse,
} from "@/types/oauth.types";

const STORAGE_KEY = "oauth_pkce";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const errorParam = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  const [step, setStep] = useState<
    "init" | "exchange" | "userinfo" | "done" | "error"
  >("init");
  const [tokenData, setTokenData] = useState<IOAuthTokenResponse | null>(null);
  const [userInfoData, setUserInfoData] =
    useState<IOAuthUserInfoResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (errorParam) {
      setErrorMessage(errorDesc || errorParam);
      setStep("error");
      return;
    }

    if (code && returnedState) {
      handleExchange(code, returnedState);
    } else {
      setErrorMessage("Missing authorization code or state parameter");
      setStep("error");
    }
  }, [code, returnedState, errorParam, errorDesc]);

  const handleExchange = async (authCode: string, state: string) => {
    setStep("exchange");
    try {
      // Retrieve stored PKCE data
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setErrorMessage("PKCE session expired. Please restart the flow.");
        setStep("error");
        return;
      }

      const { codeVerifier, state: storedState, clientId } = JSON.parse(stored);

      if (state !== storedState) {
        setErrorMessage("State mismatch — possible CSRF attack!");
        setStep("error");
        return;
      }

      sessionStorage.removeItem(STORAGE_KEY);

      // Token exchange
      const params = new URLSearchParams();
      params.append("grant_type", "authorization_code");
      params.append("code", authCode);
      params.append("code_verifier", codeVerifier);
      params.append("client_id", clientId || "");

      const tokenRes = await fetch("/api/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const tokenJson = await tokenRes.json();

      if (tokenJson.status && tokenJson.data) {
        const tokens = tokenJson.data as IOAuthTokenResponse;
        setTokenData(tokens);

        // Fetch UserInfo
        setStep("userinfo");
        const userInfoRes = await fetch("/api/oauth/userinfo", {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        const userInfoJson = await userInfoRes.json();

        if (userInfoJson.status && userInfoJson.data) {
          setUserInfoData(userInfoJson.data);
        }
        setStep("done");
      } else {
        setErrorMessage(tokenJson.message || "Token exchange failed");
        setStep("error");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Token exchange failed",
      );
      setStep("error");
    }
  };

  if (step === "init") {
    return <PageSpinner message="Processing OAuth callback..." />;
  }

  if (step === "error") {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card title="OAuth Error">
          <Badge variant="danger" className="mb-4">
            {errorParam || "Error"}
          </Badge>
          <p className="text-red-600 dark:text-red-400">{errorMessage}</p>
          <div className="mt-6 flex gap-2">
            <Button onClick={() => router.push("/oauth-demo")}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-6">
      {/* Progress */}
      <Card>
        <div className="flex items-center gap-3">
          {["Authorize", "Token Exchange", "UserInfo", "Complete"].map(
            (label, i) => {
              const steps = ["init", "exchange", "userinfo", "done"];
              const currentIdx = steps.indexOf(step);
              const isComplete = i <= currentIdx;
              const isCurrent = i === currentIdx;

              return (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      isComplete
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                    }`}
                  >
                    {isCurrent && step !== "done" ? (
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      "✓"
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {label}
                  </span>
                  {i < 3 && (
                    <span className="text-gray-300 dark:text-gray-600">→</span>
                  )}
                </div>
              );
            },
          )}
        </div>
      </Card>

      {/* Token Response */}
      {tokenData && (
        <Card title="Token Response (POST /oauth/token)">
          <dl className="divide-y divide-gray-200 dark:divide-gray-700">
            {[
              ["Access Token", `${tokenData.accessToken.substring(0, 32)}...`],
              ["Token Type", tokenData.tokenType],
              ["Expires In", `${tokenData.expiresIn}s`],
              [
                "Refresh Token",
                tokenData.refreshToken
                  ? `${tokenData.refreshToken.substring(0, 32)}...`
                  : "N/A",
              ],
              ["Scope", tokenData.scope || "N/A"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2">
                <dt className="text-sm font-medium text-gray-500">{label}</dt>
                <dd className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* UserInfo Response */}
      {userInfoData && (
        <Card title="UserInfo Response (GET /oauth/userinfo)">
          <dl className="divide-y divide-gray-200 dark:divide-gray-700">
            {[
              ["sub", userInfoData.sub],
              ["name", userInfoData.name],
              ["email", userInfoData.email],
              ["preferred_username", userInfoData.preferredUsername],
              ["phone_number", userInfoData.phoneNumber],
              ["email_verified", String(userInfoData.emailVerified)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2">
                <dt className="text-sm font-medium text-gray-500">{label}</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">
                  {String(value ?? "—")}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* Raw JSON */}
      {tokenData && (
        <Card title="Raw Responses">
          <details className="mb-2">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              Token Response
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800">
              {JSON.stringify(tokenData, null, 2)}
            </pre>
          </details>
          {userInfoData && (
            <details>
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                UserInfo Response
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800">
                {JSON.stringify(userInfoData, null, 2)}
              </pre>
            </details>
          )}
        </Card>
      )}

      <div className="flex gap-2">
        <Button onClick={() => router.push("/oauth-demo")}>
          Start New Flow
        </Button>
        <Button variant="outline" onClick={() => router.push("/")}>
          Go Home
        </Button>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<PageSpinner message="Loading callback..." />}>
      <CallbackContent />
    </Suspense>
  );
}
