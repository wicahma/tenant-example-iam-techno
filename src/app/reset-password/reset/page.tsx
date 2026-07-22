"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Badge } from "@/components/ui/Badge";
import { usePasswordReset } from "@/hooks/usePasswordReset";
import { EResetStep } from "@/types/password.types";

function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const providerFromUrl = searchParams.get("provider") || "";

  const [passwordToken, setPasswordToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [reNewPassword, setReNewPassword] = useState("");
  const { state, setProvider, completeReset, loading } = usePasswordReset();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Override the token in the hook state
    const success = await completeReset(newPassword, reNewPassword);
    if (success) {
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  // Password strength check
  const passwordStrength = (): {
    text: string;
    variant: "danger" | "warning" | "success";
  } => {
    if (!newPassword) return { text: "Enter a password", variant: "danger" };
    const checks = [
      newPassword.length >= 8,
      newPassword.length <= 30,
      /[A-Z]/.test(newPassword),
      /[a-z]/.test(newPassword),
      /\d/.test(newPassword),
      /[^A-Za-z0-9]/.test(newPassword),
      !/\s/.test(newPassword),
    ];
    const passed = checks.filter(Boolean).length;
    if (passed <= 3) return { text: "Weak", variant: "danger" };
    if (passed <= 5) return { text: "Medium", variant: "warning" };
    return { text: "Strong", variant: "success" };
  };

  const strength = passwordStrength();

  // Success state
  if (state.step === EResetStep.Success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card title="Password Reset Complete!">
          <p className="text-green-600 dark:text-green-400">
            Your password has been successfully reset.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Redirecting to login page...
          </p>
          <Button className="mt-4" onClick={() => router.push("/login")}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 space-y-6">
      <Card
        title="Reset Password — Step 3"
        description="POST /public/reset-password/reset — Set your new password."
        footer={
          <Button
            variant="ghost"
            onClick={() => router.push("/reset-password")}
          >
            Start Over
          </Button>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Token input (may be auto-filled from URL) */}
          <FormField
            label="Password Reset Token"
            name="passwordToken"
            value={passwordToken}
            onChange={setPasswordToken}
            placeholder="Paste your reset token here"
            required
            helperText="From email link, SMS validation, or email OTP validation"
          />

          <FormField
            label="New Password"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            required
            helperText="8-30 characters, uppercase, lowercase, digit, special char, no spaces"
          />

          {newPassword && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Strength:</span>
              <Badge variant={strength.variant}>{strength.text}</Badge>
            </div>
          )}

          <FormField
            label="Confirm New Password"
            name="reNewPassword"
            type="password"
            value={reNewPassword}
            onChange={setReNewPassword}
            required
            error={
              reNewPassword && newPassword !== reNewPassword
                ? "Passwords do not match"
                : undefined
            }
          />

          <Button
            type="submit"
            loading={loading}
            disabled={
              !passwordToken ||
              !newPassword ||
              newPassword !== reNewPassword ||
              newPassword.length < 8
            }
          >
            Reset Password
          </Button>
        </form>
      </Card>

      {/* Provider info */}
      {providerFromUrl && (
        <Card>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Provider: <Badge>{providerFromUrl}</Badge>
          </p>
        </Card>
      )}
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <ResetContent />
    </Suspense>
  );
}
