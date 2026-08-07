"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { useProfile } from "@/hooks/useProfile";
import { useToken } from "@/hooks/useToken";
import { apiChangePassword } from "@/services/password.service";
import { apiLogout } from "@/services/auth.service";
import type { IValidateTokensResponse } from "@/types/auth.types";

const shorten = (value?: string | null, len = 24) =>
  value && value.length > len ? `${value.slice(0, len)}...` : value || "—";

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "—";

export default function ProfilePage() {
  const router = useRouter();
  const {
    profile,
    loading,
    error,
    updateProfile,
    refresh: refetchProfile,
  } = useProfile();
  const {
    tokens,
    refreshing,
    validating,
    lastRefresh,
    tokenStatus,
    loadTokens,
    refreshToken,
    validateTokens,
  } = useToken();

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [updating, setUpdating] = useState(false);

  // Change password state
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  const [refetching, setRefetching] = useState(false);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const handleRefetchProfile = async () => {
    setRefetching(true);
    await refetchProfile();
    setRefetching(false);
  };

  const startEdit = () => {
    if (profile) {
      setFullName(profile.fullName);
      setPhoneNumber(profile.phoneNumber || "");
      setEditMode(true);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    await updateProfile({ fullName, phoneNumber });
    setUpdating(false);
    setEditMode(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) return;

    setChangingPwd(true);
    try {
      const data = await apiChangePassword({
        currentPassword: currentPwd,
        newPassword: newPwd,
        confirmNewPassword: confirmPwd,
      });
      if (data.status) {
        alert("Password changed successfully!");
        setShowChangePwd(false);
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
      } else {
        alert(data.message || "Failed to change password");
      }
    } catch {
      alert("Network error");
    } finally {
      setChangingPwd(false);
    }
  };

  const handleLogout = async () => {
    await apiLogout();
    router.push("/login");
  };

  if (loading) return <PageSpinner message="Loading profile..." />;

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <Card title="Profile Error">
          <p className="text-red-500">{error}</p>
          <p className="mt-2 text-sm text-gray-500">
            Try logging in first or check your API configuration.
          </p>
          <Button className="mt-4" onClick={() => router.push("/login")}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-6">
      {/* Profile Card */}
      <Card
        title="User Profile"
        description={
          editMode ? "Edit your profile information" : "GET /public/me"
        }
        footer={
          <div className="flex flex-wrap gap-2">
            {!editMode ? (
              <>
                <Button onClick={startEdit}>Edit Profile</Button>
                <Button
                  variant="outline"
                  onClick={() => setShowChangePwd(!showChangePwd)}
                >
                  Change Password
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleRefetchProfile}
                  loading={refetching}
                >
                  Refetch User Data
                </Button>
                <Button variant="danger" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button type="submit" form="edit-form" loading={updating}>
                  Save Changes
                </Button>
                <Button variant="ghost" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        }
      >
        {editMode ? (
          <form
            id="edit-form"
            onSubmit={handleUpdate}
            className="flex flex-col gap-4"
          >
            <FormField
              label="Full Name"
              name="fullName"
              value={fullName}
              onChange={setFullName}
            />
            <FormField
              label="Phone Number"
              name="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={setPhoneNumber}
              placeholder="+628123456789"
            />
            <p className="text-xs text-gray-500">
              Only <code>fullName</code> and <code>phoneNumber</code> can be
              updated via PUT /public/me.
            </p>
          </form>
        ) : (
          <dl className="divide-y divide-gray-200 dark:divide-gray-700">
            {[
              ["ID", profile?.id],
              ["NPK", profile?.npk],
              ["Full Name", profile?.fullName],
              ["Email", profile?.email],
              ["Phone", profile?.phoneNumber || "—"],
              ["App", profile?.application?.appName],
              ["App ID", profile?.application?.appIdentifier],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {label}
                </dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">
                  {String(value ?? "—")}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Card>

      {/* Change Password */}
      {showChangePwd && (
        <Card
          title="Change Password"
          description="POST /public/me/change-password"
        >
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <FormField
              label="Current Password"
              name="currentPassword"
              type="password"
              value={currentPwd}
              onChange={setCurrentPwd}
              required
            />
            <FormField
              label="New Password"
              name="newPassword"
              type="password"
              value={newPwd}
              onChange={setNewPwd}
              required
              helperText="8-30 chars, uppercase, lowercase, digit, special char"
            />
            <FormField
              label="Confirm New Password"
              name="confirmNewPassword"
              type="password"
              value={confirmPwd}
              onChange={setConfirmPwd}
              required
              error={
                confirmPwd && newPwd !== confirmPwd
                  ? "Passwords do not match"
                  : undefined
              }
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                loading={changingPwd}
                disabled={newPwd !== confirmPwd}
              >
                Change Password
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowChangePwd(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Token Management */}
      <Card
        title="Token Management"
        description="Manually refresh tokens, validate access/refresh token status, and inspect your current session."
      >
        {/* Current tokens */}
        <dl className="divide-y divide-gray-200 dark:divide-gray-700">
          {[
            ["Access Token", shorten(tokens?.accessToken)],
            ["Refresh Token", shorten(tokens?.refreshToken)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {label}
              </dt>
              <dd className="max-w-[60%] truncate font-mono text-xs text-gray-900 dark:text-gray-100">
                {String(value)}
              </dd>
            </div>
          ))}
        </dl>

        {/* Actions */}
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            onClick={refreshToken}
            loading={refreshing}
            disabled={!tokens?.refreshToken}
          >
            Refresh Token
          </Button>
          <Button
            variant="outline"
            onClick={validateTokens}
            loading={validating}
            disabled={!tokens?.accessToken || !tokens?.refreshToken}
          >
            Validate Tokens
          </Button>
        </div>

        {/* Last refresh result */}
        {lastRefresh && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Last Refresh (POST /public/me/refresh-token)
            </h4>
            <dl className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                ["New Access Token", shorten(lastRefresh.accessToken)],
                ["New Refresh Token", shorten(lastRefresh.refreshToken)],
                ["Expires In", `${lastRefresh.expiresIn}s`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1.5">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">
                    {label}
                  </dt>
                  <dd className="max-w-[60%] truncate font-mono text-xs text-gray-900 dark:text-gray-100">
                    {String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Validation result */}
        {tokenStatus && (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Token Status (POST /public/me/validate-tokens)
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TokenStatusView
                label="Access Token"
                status={tokenStatus.accessToken}
              />
              <TokenStatusView
                label="Refresh Token"
                status={tokenStatus.refreshToken}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Raw JSON */}
      <Card title="Raw Response (GET /public/me)">
        <pre className="max-h-64 overflow-auto rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </Card>
    </div>
  );
}

function TokenStatusView({
  label,
  status,
}: {
  label: string;
  status: IValidateTokensResponse["accessToken"];
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <Badge variant={status.isValid ? "success" : "danger"}>
          {status.isValid ? "Valid" : "Invalid"}
        </Badge>
      </div>
      <dl className="space-y-1">
        <div className="flex justify-between text-xs">
          <dt className="text-gray-500 dark:text-gray-400">Expires</dt>
          <dd className="font-mono text-gray-900 dark:text-gray-100">
            {formatDate(status.expiresAt)}
          </dd>
        </div>
        {status.message && (
          <div className="flex justify-between text-xs">
            <dt className="text-gray-500 dark:text-gray-400">Message</dt>
            <dd className="text-red-500">{status.message}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
