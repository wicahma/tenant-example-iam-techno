"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { usePasswordReset } from "@/hooks/usePasswordReset";
import { TResetProvider, EResetStep } from "@/types/password.types";

function ValidateOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = (searchParams.get("provider") || "sms") as Extract<
    TResetProvider,
    "sms" | "email-otp"
  >;
  const identifierFromUrl = searchParams.get("identifier") || "";

  const { state, setProvider, setIdentifier, validateOtp, loading, sendReset } =
    usePasswordReset();
  const [otpCode, setOtpCode] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setProvider(provider as TResetProvider);
    if (identifierFromUrl) setIdentifier(identifierFromUrl);
  }, [provider, identifierFromUrl, setProvider, setIdentifier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await validateOtp(otpCode);
    if (success) {
      router.push(
        `/reset-password/reset?token=${encodeURIComponent(state.passwordToken)}&provider=${provider}`,
      );
    }
  };

  const handleResend = async () => {
    setResending(true);
    await sendReset();
    setResending(false);
  };

  return (
    <Card
      title="Reset Password — Step 2"
      description={`POST /public/reset-password/validate — Validate ${provider.toUpperCase()} OTP code.`}
      footer={
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => router.push("/reset-password")}
          >
            Back
          </Button>
          <Button variant="outline" onClick={handleResend} loading={resending}>
            Resend OTP
          </Button>
        </div>
      }
    >
      {/* OTP Info */}
      {state.maskedOtp && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          <p>
            Masked OTP: <code className="font-bold">{state.maskedOtp}</code>
          </p>
          <p>Expires in: {state.expiresInMinutes} minutes</p>
          <p>
            Attempts: {state.currentAttempts} / {state.maxAttempts}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label="Identifier"
          name="identifier"
          value={identifierFromUrl}
          onChange={() => {}}
          disabled
          helperText={provider === "sms" ? "Phone number" : "Email address"}
        />

        <FormField
          label="OTP Code"
          name="otpCode"
          value={otpCode}
          onChange={setOtpCode}
          placeholder="Enter 6-digit OTP"
          required
          helperText="Max 3 attempts before OTP expires"
        />

        <Button type="submit" loading={loading} disabled={otpCode.length < 6}>
          Validate OTP
        </Button>
      </form>
    </Card>
  );
}

export default function ValidateOtpPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <ValidateOtpContent />
      </Suspense>
    </div>
  );
}
