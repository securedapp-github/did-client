import React, { useCallback, useEffect, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import { getMe, updateProfile, sendOtp, verifyOtp } from "../utils/api";
import { useAuthContext } from "../context/AuthContext";

const INSTITUTION_TYPES = ["University", "College", "Institute", "Department"];
const ISSUANCE_VOLUMES = ["1-100", "100-1,000", "1,000-10,000", "10,000+"];
const ACCOUNT_FIELDS = [
  "institutionName",
  "institutionType",
  "website",
  "contactPerson",
  "contactEmail",
  "contactPhone",
  "country",
  "state",
  "city",
  "address",
  "expectedIssuanceVolume",
];

const sanitizePhone = (value) => (value || '').toString().replace(/\D/g, '').slice(0, 10);

const Account = () => {
  const [accountData, setAccountData] = useState(null);
  const [accountInitialData, setAccountInitialData] = useState(null);
  const [accountMeta, setAccountMeta] = useState({ id: null, did: "" });
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountSuccess, setAccountSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { user, login } = useAuthContext();

  const currentEmail = String(user?.email ?? "").trim().toLowerCase();

  // Password reset state
  const [resetStep, setResetStep] = useState("idle"); // idle | email | otp
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetEmail, setResetEmail] = useState(currentEmail);
  const [resetOtp, setResetOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  const normalizeAccount = useCallback((payload = {}) => {
    return ACCOUNT_FIELDS.reduce((acc, key) => {
      const value = payload[key];
      acc[key] = typeof value === "string" ? value : value ?? "";
      return acc;
    }, {});
  }, []);

  const loadAccount = useCallback(async () => {
    setAccountLoading(true);
    setAccountError("");
    try {
      const res = await getMe();
      const payload = res?.data?.user || res?.data?.data || res?.data;
      if (!payload) {
        throw new Error("Empty response received from server");
      }

      const normalized = normalizeAccount(payload);
      setAccountData(normalized);
      setAccountInitialData({ ...normalized });
      setAccountMeta({
        id: payload?.id ?? null,
        did: payload?.did ?? "",
      });
      setAccountSuccess("");
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to load account details:", err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Failed to load account details.";
      setAccountError(message);
      setAccountData(null);
    } finally {
      setAccountLoading(false);
    }
  }, [normalizeAccount]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  useEffect(() => {
    setResetEmail(currentEmail);
  }, [currentEmail]);

  const handleAccountChange = (event) => {
    const { name, value } = event.target;
    if (!isEditing) return;
    if (name === 'contactPhone') {
      const digitsOnly = sanitizePhone(value);
      setAccountData((prev) => ({ ...(prev || {}), [name]: digitsOnly }));
    } else {
      setAccountData((prev) => ({ ...(prev || {}), [name]: value }));
    }
    setAccountSuccess("");
  };

  const handleCancelEdit = () => {
    if (accountInitialData) {
      setAccountData({ ...accountInitialData });
    }
    setAccountSuccess("");
    setAccountError("");
    setIsEditing(false);
  };

  const handleAccountSubmit = async (event) => {
    event.preventDefault();
    if (!accountData || !isEditing) return;

    const digitsOnly = sanitizePhone(accountData.contactPhone);
    if (digitsOnly.length !== 10) {
      setAccountError('Contact phone must be exactly 10 digits.');
      setAccountSuccess('');
      return;
    }

    setAccountSaving(true);
    setAccountSuccess("");
    setAccountError("");

    try {
      const payload = {};
      ACCOUNT_FIELDS.forEach((key) => {
        const value = key === 'contactPhone' ? digitsOnly : accountData[key];
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (trimmed) {
            payload[key] = trimmed;
          }
        } else if (value !== undefined && value !== null) {
          payload[key] = value;
        }
      });

      const res = await updateProfile(payload);
      const updated = res?.data?.user || res?.data?.data || res?.data;

      if (updated) {
        const normalized = normalizeAccount(updated);
        setAccountData(normalized);
        setAccountInitialData({ ...normalized });
        setAccountMeta((prev) => ({
          id: updated?.id ?? prev.id ?? null,
          did: updated?.did ?? prev.did ?? "",
        }));

        if (updated?.contactEmail && updated.contactEmail !== currentEmail) {
          login(updated.contactEmail);
        }
      }

      setAccountSuccess("Account details updated successfully.");
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update account:", err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Failed to update account details.";
      setAccountError(message);
    } finally {
      setAccountSaving(false);
    }
  };

  const startPasswordReset = () => {
    setResetError("");
    setResetSuccess("");
    setResetOtp("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setShowResetNewPassword(false);
    setShowResetConfirmPassword(false);
    setResetEmail(currentEmail);
    setResetStep("email");
  };

  const cancelPasswordReset = () => {
    setResetStep("idle");
    setResetError("");
    setResetSuccess("");
    setResetLoading(false);
    setResetOtp("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setShowResetNewPassword(false);
    setShowResetConfirmPassword(false);
  };

  const handleSendResetOtp = async (event) => {
    event.preventDefault();
    const email = String(resetEmail || "").trim().toLowerCase();
    if (!email) {
      setResetError("Email is required to send OTP");
      return;
    }
    try {
      setResetLoading(true);
      setResetError("");
      setResetSuccess("");
      await sendOtp({ email });
      setResetSuccess(`OTP sent to ${email}. Check your inbox (and spam folder).`);
      setResetStep("otp");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to send OTP";
      setResetError(message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmPasswordReset = async (event) => {
    event.preventDefault();
    if (!resetOtp || resetOtp.length !== 6) {
      setResetError("Please enter a valid 6-digit OTP");
      return;
    }
    if (!resetNewPassword || !resetConfirmPassword) {
      setResetError("Enter and confirm the new password");
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError("Passwords do not match");
      return;
    }

    try {
      setResetLoading(true);
      setResetError("");
      await verifyOtp({
        email: String(resetEmail || "").trim().toLowerCase(),
        otp: resetOtp,
        newPassword: resetNewPassword,
        confirmPassword: resetConfirmPassword,
      });
      setResetSuccess("Password updated successfully. Use the new password next time you log in.");
      setResetStep("idle");
      setResetOtp("");
      setResetNewPassword("");
      setResetConfirmPassword("");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to reset password";
      setResetError(message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6">
        <PageHeader
          title="Account Settings"
          subtitle="Manage your institution profile and contact information."
        />

        <div className="bg-white p-4 md:p-6 rounded shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Institution Profile</h3>
              <p className="text-sm text-gray-500">
                Update the details visible to SecureX-DID services and notifications.
              </p>
            </div>
            {accountMeta?.did && (
              <div className="text-sm text-gray-600 break-all">
                <span className="font-medium text-gray-700">DID:</span> {accountMeta.did}
              </div>
            )}
          </div>

          <div className="mt-4">
            {accountLoading ? (
              <div className="flex items-center justify-center py-6 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#14B87D] mr-3" />
                Loading account information...
              </div>
            ) : accountData ? (
              <>
                {accountError && (
                  <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {accountError}
                  </div>
                )}
                {accountSuccess && (
                  <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                    {accountSuccess}
                  </div>
                )}

                <form onSubmit={handleAccountSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="institutionName" className="block text-sm font-medium text-gray-700 mb-1">
                      Institution Name
                    </label>
                    <input
                      id="institutionName"
                      name="institutionName"
                      type="text"
                      required
                      disabled={!isEditing}
                      value={accountData?.institutionName || ""}
                      onChange={handleAccountChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D]"
                    />
                  </div>

                  <div>
                    <label htmlFor="institutionType" className="block text-sm font-medium text-gray-700 mb-1">
                      Institution Type
                    </label>
                    <select
                      id="institutionType"
                      name="institutionType"
                      required
                      disabled={!isEditing}
                      value={accountData?.institutionType || INSTITUTION_TYPES[0]}
                      onChange={handleAccountChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D]"
                    >
                      {INSTITUTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      id="website"
                      name="website"
                      type="url"
                      required
                      disabled={!isEditing}
                      value={accountData?.website || ""}
                      onChange={handleAccountChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D]"
                    />
                  </div>

                  <div>
                    <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      id="contactPerson"
                      name="contactPerson"
                      type="text"
                      required
                      disabled={!isEditing}
                      value={accountData?.contactPerson || ""}
                      onChange={handleAccountChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D]"
                    />
                  </div>

                

                  <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone <span className="text-xs text-gray-500">(exactly 10 digits)</span>
                    </label>
                    <input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      placeholder="9876543210"
                      required
                      disabled={!isEditing}
                      value={accountData?.contactPhone || ""}
                      onChange={handleAccountChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D] disabled:bg-gray-100"
                    />
                    {isEditing && accountData?.contactPhone && accountData.contactPhone.length !== 10 && (
                      <p className="mt-1 text-xs text-amber-600">{accountData.contactPhone.length} / 10 digits entered</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      id="country"
                      name="country"
                      type="text"
                      required
                      disabled={!isEditing}
                      value={accountData?.country || ""}
                      onChange={handleAccountChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D]"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      id="state"
                      name="state"
                      type="text"
                      required
                      disabled={!isEditing}
                      value={accountData?.state || ""}
                      onChange={handleAccountChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D]"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      disabled={!isEditing}
                      value={accountData?.city || ""}
                      onChange={handleAccountChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      disabled={!isEditing}
                      value={accountData?.address || ""}
                      onChange={handleAccountChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D]"
                    />
                  </div>

                  <div>
                    <label htmlFor="expectedIssuanceVolume" className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Issuance Volume
                    </label>
                    <select
                      id="expectedIssuanceVolume"
                      name="expectedIssuanceVolume"
                      required
                      disabled={!isEditing}
                      value={accountData?.expectedIssuanceVolume || ISSUANCE_VOLUMES[0]}
                      onChange={handleAccountChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D]"
                    >
                      {ISSUANCE_VOLUMES.map((volume) => (
                        <option key={volume} value={volume}>
                          {volume}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-3 pt-2">
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAccountSuccess("");
                          setAccountError("");
                          setIsEditing(true);
                        }}
                        className="inline-flex items-center px-4 py-2 rounded-md bg-[#14B87D] text-white text-sm hover:brightness-95"
                      >
                        Edit Details
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={accountSaving}
                          className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={accountSaving}
                          className="inline-flex items-center px-4 py-2 rounded-md bg-[#14B87D] text-white text-sm hover:brightness-95 disabled:opacity-50"
                        >
                          {accountSaving ? "Saving..." : "Save Changes"}
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </>
            ) : (
              <div className="rounded border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                <p className="font-medium">Account details are unavailable.</p>
                <p className="mt-1">{accountError || "Please try reloading."}</p>
                <button
                  type="button"
                  onClick={loadAccount}
                  className="mt-3 inline-flex items-center gap-1 text-[#14B87D] hover:underline"
                >
                  Retry loading account
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-[#14B87D]/20 bg-white/95 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Security & Password</h3>
              <p className="text-sm text-gray-600">Reset your dashboard password using the verified email-based OTP flow.</p>
            </div>
            {resetStep === "idle" && (
              <div className="flex gap-2">
                {resetSuccess && (
                  <span className="hidden text-sm font-medium text-[#14B87D] md:inline">{resetSuccess}</span>
                )}
                <button
                  type="button"
                  onClick={startPasswordReset}
                  className="inline-flex items-center rounded-full bg-[#14B87D] px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
                >
                  Reset Password
                </button>
              </div>
            )}
          </div>

          {resetSuccess && resetStep !== "idle" && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {resetSuccess}
            </div>
          )}
          {resetError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {resetError}
            </div>
          )}

          {resetStep !== "idle" && (
            <div className="mt-5 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                {resetStep === "email" && (
                  <form onSubmit={handleSendResetOtp} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registered email</label>
                      <input
                        type="email"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-[#14B87D] focus:outline-none"
                        value={resetEmail}
                        onChange={(event) => setResetEmail(event.target.value)}
                        placeholder="name@example.com"
                        autoComplete="email"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="inline-flex items-center rounded-full bg-[#14B87D] px-4 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
                    >
                      {resetLoading ? "Sending OTP..." : "Send OTP"}
                    </button>
                  </form>
                )}

                {resetStep === "otp" && (
                  <form onSubmit={handleConfirmPasswordReset} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">6-digit OTP</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm tracking-widest shadow-sm focus:border-[#14B87D] focus:outline-none"
                        value={resetOtp}
                        onChange={(event) => setResetOtp(event.target.value.replace(/\D/g, ""))}
                        placeholder="••••••"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                      <input
                        type={showResetNewPassword ? "text" : "password"}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm shadow-sm focus:border-[#14B87D] focus:outline-none"
                        value={resetNewPassword}
                        onChange={(event) => setResetNewPassword(event.target.value)}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-[26px] right-3 flex items-center text-[#14B87D] hover:opacity-90"
                        onClick={() => setShowResetNewPassword((prev) => !prev)}
                        aria-label={showResetNewPassword ? "Hide new password" : "Show new password"}
                      >
                        {showResetNewPassword ? <FiEye className="h-5 w-5 mt-6" /> : <FiEyeOff className="h-5 w-5 mt-6" />}
                      </button>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                      <input
                        type={showResetConfirmPassword ? "text" : "password"}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm shadow-sm focus:border-[#14B87D] focus:outline-none"
                        value={resetConfirmPassword}
                        onChange={(event) => setResetConfirmPassword(event.target.value)}
                        placeholder="Re-enter new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-[26px] right-3 flex items-center text-[#14B87D] hover:opacity-90"
                        onClick={() => setShowResetConfirmPassword((prev) => !prev)}
                        aria-label={showResetConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                      >
                        {showResetConfirmPassword ? <FiEye className="h-5 w-5 mt-6" /> : <FiEyeOff className="h-5 w-5 mt-6" />}
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="inline-flex items-center rounded-full bg-[#14B87D] px-4 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
                    >
                      {resetLoading ? "Resetting..." : "Update Password"}
                    </button>
                  </form>
                )}
              </div>
              <div className="space-y-3 rounded-2xl border border-[#14B87D]/15 bg-[#ecfdf5]/50 px-4 py-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">How it works</p>
                <ul className="space-y-2 list-disc pl-5">
                  <li>We email an OTP to the registered address ({resetEmail || currentEmail || "your email"}).</li>
                  <li>Enter the OTP within 10 minutes to verify the reset request.</li>
                  <li>Choose a strong password you have not used before.</li>
                </ul>
                <p className="text-xs text-gray-500">Need help? Contact <a href="mailto:support@securedapp.io" className="text-[#14B87D] hover:underline">support@securedapp.io</a>.</p>
              </div>
            </div>
          )}

          {resetStep !== "idle" && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              {resetSuccess && resetStep === "idle" && (
                <span className="text-sm font-medium text-[#14B87D]">{resetSuccess}</span>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelPasswordReset}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                {resetStep === "otp" && (
                  <button
                    type="button"
                    onClick={(event) => handleSendResetOtp(event)}
                    disabled={resetLoading}
                    className="rounded-full border border-[#14B87D]/50 px-4 py-2 text-sm text-[#14B87D] hover:bg-[#ecfdf5] disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {resetStep === "idle" && resetSuccess && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {resetSuccess}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Account;
