"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [usernameSource, setUsernameSource] = useState("npk,email");
  const [responseType, setResponseType] = useState("default");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(
      { identifier, password },
      usernameSource,
      responseType,
    );
    if (success) {
      // Fetch the full response from /me to show
      try {
        const res = await fetch("/api/public/me");
        const data = await res.json();
        setResult(data);
      } catch {
        setResult({ message: "Login succeeded but profile fetch failed" });
      }
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card
        title="Manual Login"
        description="POST /public/manual/login — Password-based tenant authentication."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="Identifier"
            name="identifier"
            value={identifier}
            onChange={setIdentifier}
            placeholder="npk, email, or username"
            required
            autoComplete="username"
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />

          <FormField
            label="Username Source"
            name="usernameSource"
            type="select"
            value={usernameSource}
            onChange={setUsernameSource}
            options={[
              { value: "npk,email", label: "NPK + Email" },
              { value: "npk", label: "NPK only" },
              { value: "email", label: "Email only" },
              { value: "username", label: "Username only" },
              { value: "npk,email,username", label: "All sources" },
            ]}
            helperText="Header: x-username-source"
          />

          <FormField
            label="Response Type"
            name="responseType"
            type="select"
            value={responseType}
            onChange={setResponseType}
            options={[
              { value: "default", label: "Default (full tokens)" },
              { value: "pre-token", label: "Pre-Token (temporary)" },
            ]}
            helperText="Header: x-response-type"
          />

          <Button type="submit" loading={loading} className="mt-2">
            Login
          </Button>
        </form>
      </Card>

      {/* Result */}
      {result && (
        <Card title="Response" className="mt-6">
          <pre className="max-h-96 overflow-auto rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800">
            {JSON.stringify(result, null, 2)}
          </pre>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => router.push("/me")}>
              View Profile
            </Button>
            <Button variant="outline" onClick={() => setResult(null)}>
              Clear
            </Button>
          </div>
        </Card>
      )}

      {/* API Info */}
      <Card className="mt-6">
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong>Tenant Headers (auto-generated):</strong>{" "}
            <code className="text-xs">X-App-Identifier</code>,{" "}
            <code className="text-xs">X-Timestamp</code>,{" "}
            <code className="text-xs">X-Nonce</code>,{" "}
            <code className="text-xs">X-Key-Id</code>,{" "}
            <code className="text-xs">X-Signature</code>,{" "}
            <code className="text-xs">APIKey</code>
          </p>
          <p>
            <strong>Custom Headers:</strong>{" "}
            <code className="text-xs">x-username-source</code>,{" "}
            <code className="text-xs">x-response-type</code>
          </p>
          <p>
            <strong>Tokens:</strong> Stored in encrypted httpOnly cookie after
            successful login.
          </p>
        </div>
      </Card>
    </div>
  );
}
