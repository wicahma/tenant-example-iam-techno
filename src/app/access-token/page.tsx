"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useAccessToken } from "@/hooks/useAccessToken";

export default function AccessTokenPage() {
  const { token, setToken, verify, result, loading, error } = useAccessToken();
  const [copied, setCopied] = useState(false);

  const copyToken = () => {
    if (!token) return;
    void navigator.clipboard?.writeText(token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Product Access Token (ba-token)
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Token akses terenkripsi (AES) yang diterbitkan oleh admin console
          untuk product API. Validasi token memakai kuota tenant→product di sisi
          backend.
        </p>
      </div>

      <Card className="space-y-4" title="Verifikasi Token">
        <FormField
          label="Token"
          name="token"
          value={token}
          onChange={setToken}
          placeholder="ba-xxxx..."
          required
          helperText="Tempel token berformat ba-{encrypted}. Token hanya valid bila dikeluarkan untuk tenant & product API ini."
        />
        <div className="flex gap-2">
          <Button
            onClick={verify}
            disabled={!token.trim() || loading}
            loading={loading}
          >
            {loading ? "Memverifikasi..." : "Verifikasi"}
          </Button>
          <Button variant="outline" onClick={copyToken} disabled={!token}>
            {copied ? "Tersalin!" : "Salin"}
          </Button>
        </div>

        {error && (
          <Badge variant="danger" className="block">
            {error}
          </Badge>
        )}

        {result && (
          <div className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Status:
              </span>
              {result.valid ? (
                <Badge variant="success">Valid</Badge>
              ) : (
                <Badge variant="danger">Tidak Valid</Badge>
              )}
            </div>
            {result.valid ? (
              <>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Tenant ID: <code>{result.tenantId}</code>
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Product ID: <code>{result.productId}</code>
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Kuota tersisa: <code>{result.remaining ?? "-"}</code>
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {result.error}
              </p>
            )}
          </div>
        )}
      </Card>

      <Card className="mt-6" title="Format Token">
        <pre className="overflow-x-auto rounded-lg bg-gray-100 p-4 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {`ba-{encrypted-json}

Payload terenkripsi (AES-256-CBC):
{
  "tenantId": 1,
  "productId": 3,
  "iat": 1750000000,
  "exp": 1752592000
}

Alur:
1. Token diterima dengan header: Authorization: ba-{encrypted}
2. Backend dekripsi & cek expiry
3. Kuota (limit per tenant→product) dicek & dikurangi
4. Sisa kuota dikembalikan`}
        </pre>
      </Card>
    </div>
  );
}
