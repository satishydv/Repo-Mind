"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";

interface AuthCardProps {
  mode: "sign-in" | "sign-up";
}

export function CustomAuthCard({ mode }: AuthCardProps) {
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/sync-user";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"github" | "google" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forgot password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  // Verification step for Sign Up (email code)
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const isLoaded = mode === "sign-in" ? isSignInLoaded : isSignUpLoaded;

  // Handle OAuth Sign In / Sign Up
  const handleOAuth = async (strategy: "oauth_github" | "oauth_google", provider: "github" | "google") => {
    if (!isLoaded) return;
    setErrorMsg(null);
    setOauthLoading(provider);

    try {
      if (mode === "sign-in") {
        if (!signIn) return;
        await signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: "/sign-in/sso-callback",
          redirectUrlComplete: redirectUrl,
        });
      } else {
        if (!signUp) return;
        await signUp.authenticateWithRedirect({
          strategy,
          redirectUrl: "/sign-up/sso-callback",
          redirectUrlComplete: redirectUrl,
        });
      }
    } catch (err: unknown) {
      setOauthLoading(null);
      const message =
        err instanceof Error
          ? err.message
          : (err as { errors?: { message: string }[] })?.errors?.[0]?.message || "OAuth login failed";
      setErrorMsg(message);
      toast.error(message);
    }
  };

  // Handle Form Submit (Email + Password)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isLoading) return;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (mode === "sign-in") {
        if (!signIn) return;
        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          toast.success("Welcome back!");
          router.push(redirectUrl);
        } else {
          console.log("Sign-in incomplete status:", result.status);
          setErrorMsg("Additional verification required. Please check your email.");
        }
      } else {
        // Sign Up
        if (!signUp) return;
        await signUp.create({
          emailAddress: email,
          password,
        });

        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setPendingVerification(true);
        toast.info("Verification code sent to your email.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { errors?: { message: string }[] })?.errors?.[0]?.message || "Authentication failed";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email Verification Code (Sign Up)
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded || !signUp || isLoading) return;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === "complete") {
        await setSignUpActive({ session: completeSignUp.createdSessionId });
        toast.success("Account created successfully!");
        router.push(redirectUrl);
      } else {
        setErrorMsg("Verification incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { errors?: { message: string }[] })?.errors?.[0]?.message || "Invalid verification code";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password Request
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded || !signIn || isLoading) return;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setCodeSent(true);
      toast.success("Reset code sent to your email.");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { errors?: { message: string }[] })?.errors?.[0]?.message || "Could not send reset code";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded || !signIn || isLoading) return;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: newPassword,
      });

      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
        toast.success("Password reset successful!");
        router.push(redirectUrl);
      } else {
        setErrorMsg("Password reset could not be completed.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { errors?: { message: string }[] })?.errors?.[0]?.message || "Password reset failed";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[390px] sm:max-w-[420px] mx-auto select-none">
      {/* ========================================================================= */}
      {/* SKEUOMORPHIC OCEANIC BLUE CARD                                            */}
      {/* ========================================================================= */}
      <div className="relative rounded-[36px] bg-gradient-to-b from-[#2b72d4] via-[#1d57a4] to-[#0f3469] p-7 sm:p-9 shadow-[0_25px_60px_rgba(15,52,105,0.45),0_10px_25px_rgba(0,0,0,0.25)] border-t border-white/30 border-x border-b border-white/10 backdrop-blur-2xl">
        
        {/* Top 3D App Squircle Icon */}
        <div className="flex justify-center mb-4">
          <div className="size-16 rounded-[22px] bg-gradient-to-b from-white via-[#fcfdff] to-[#e4edf8] shadow-[0_8px_20px_rgba(0,0,0,0.2),inset_0_2px_1px_rgba(255,255,255,1)] p-2.5 flex items-center justify-center border border-white/80 transition-transform hover:scale-105 duration-300">
            {/* Japan / Fuji stylized avatar graphic from the reference image */}
            <div className="relative size-11 flex flex-col items-center justify-center overflow-hidden">
              {/* Red circular head / sun */}
              <div className="size-5 rounded-full bg-gradient-to-b from-[#ff4d4d] to-[#e62e2e] shadow-[0_2px_6px_rgba(230,46,46,0.5)] mb-0.5" />
              {/* Blue body silhouette */}
              <div className="w-8 h-4 rounded-t-full bg-gradient-to-b from-[#4a90e2] to-[#2563eb] shadow-xs" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-white text-xl sm:text-[22px] font-semibold tracking-tight text-center mb-6 drop-shadow-xs">
          {pendingVerification
            ? "Verify your email"
            : isForgotPassword
            ? "Reset your password"
            : mode === "sign-in"
            ? "Login to your account"
            : "Create your account"}
        </h1>

        {/* Error Alert Message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-100 text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-300" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* 1. SIGN IN / SIGN UP FORM                                               */}
        {/* ----------------------------------------------------------------------- */}
        {!isForgotPassword && !pendingVerification && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address Field */}
            <div>
              <label
                htmlFor="auth-email"
                className="block text-blue-100/90 text-xs sm:text-[13px] font-normal mb-1.5 ml-1"
              >
                Email Address
              </label>
              <div className="relative flex items-center bg-[#153f77]/85 hover:bg-[#153f77] focus-within:bg-[#174684] border border-blue-300/20 focus-within:border-sky-400/60 rounded-2xl h-12 px-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all">
                <Mail className="size-4 text-blue-200/70 mr-3 shrink-0" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="james@gmail.com"
                  className="w-full bg-transparent text-white text-sm placeholder-blue-200/40 outline-none font-normal"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="auth-password"
                className="block text-blue-100/90 text-xs sm:text-[13px] font-normal mb-1.5 ml-1"
              >
                Password
              </label>
              <div className="relative flex items-center bg-[#153f77]/85 hover:bg-[#153f77] focus-within:bg-[#174684] border border-blue-300/20 focus-within:border-sky-400/60 rounded-2xl h-12 px-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all">
                <Lock className="size-4 text-blue-200/70 mr-3 shrink-0" />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-transparent text-white text-sm placeholder-blue-200/40 outline-none font-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-blue-200/70 hover:text-white transition-colors ml-2 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Options Row (Keep logged in & Forgot password) */}
            <div className="flex items-center justify-between pt-0.5 text-xs sm:text-[13px]">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <div
                  onClick={() => setKeepLoggedIn(!keepLoggedIn)}
                  className={`size-4 rounded-md border border-blue-200/40 flex items-center justify-center transition-all ${
                    keepLoggedIn
                      ? "bg-sky-400 border-sky-400 text-white"
                      : "bg-white/10 group-hover:bg-white/20"
                  }`}
                >
                  {keepLoggedIn && <Check className="size-3 stroke-[3]" />}
                </div>
                <span className="text-blue-100/90 group-hover:text-white transition-colors">
                  Keep me logged in
                </span>
              </label>

              {mode === "sign-in" && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setErrorMsg(null);
                  }}
                  className="text-blue-100/90 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Primary Submit Button ("Login" / "Sign Up") */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-5 h-12 rounded-2xl bg-gradient-to-b from-[#38bdf8] via-[#0ea5e9] to-[#0284c7] hover:from-[#48c9ff] hover:to-[#0396e0] active:scale-[0.98] shadow-[0_6px_20px_rgba(14,165,233,0.45),inset_0_1px_1px_rgba(255,255,255,0.6)] text-white font-semibold text-base flex items-center justify-center transition-all cursor-pointer border-t border-white/40 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin text-white" />
              ) : mode === "sign-in" ? (
                "Login"
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* 2. FORGOT PASSWORD WORKFLOW                                             */}
        {/* ----------------------------------------------------------------------- */}
        {isForgotPassword && (
          <div className="space-y-4">
            {!codeSent ? (
              <form onSubmit={handleSendResetCode} className="space-y-4">
                <p className="text-xs text-blue-100/80 leading-relaxed">
                  Enter your email address and we will send you a verification code to reset your password.
                </p>
                <div>
                  <label className="block text-blue-100/90 text-xs font-normal mb-1.5 ml-1">
                    Email Address
                  </label>
                  <div className="relative flex items-center bg-[#153f77]/85 border border-blue-300/20 rounded-2xl h-12 px-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                    <Mail className="size-4 text-blue-200/70 mr-3 shrink-0" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="james@gmail.com"
                      className="w-full bg-transparent text-white text-sm placeholder-blue-200/40 outline-none font-normal"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl bg-gradient-to-b from-[#38bdf8] to-[#0284c7] hover:brightness-110 text-white font-semibold text-sm flex items-center justify-center shadow-lg transition-all cursor-pointer"
                >
                  {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Send Reset Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-blue-100/90 text-xs font-normal mb-1.5 ml-1">
                    Reset Code
                  </label>
                  <div className="bg-[#153f77]/85 border border-blue-300/20 rounded-2xl h-12 px-4 shadow-inner flex items-center">
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full bg-transparent text-white text-sm placeholder-blue-200/40 outline-none font-normal"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-blue-100/90 text-xs font-normal mb-1.5 ml-1">
                    New Password
                  </label>
                  <div className="bg-[#153f77]/85 border border-blue-300/20 rounded-2xl h-12 px-4 shadow-inner flex items-center">
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-transparent text-white text-sm placeholder-blue-200/40 outline-none font-normal"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl bg-gradient-to-b from-[#38bdf8] to-[#0284c7] hover:brightness-110 text-white font-semibold text-sm flex items-center justify-center shadow-lg transition-all cursor-pointer"
                >
                  {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Set New Password"}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setCodeSent(false);
                setErrorMsg(null);
              }}
              className="w-full text-center text-xs text-blue-200 hover:text-white mt-2 transition-colors cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* 3. EMAIL VERIFICATION WORKFLOW (SIGN UP)                                */}
        {/* ----------------------------------------------------------------------- */}
        {pendingVerification && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-xs text-blue-100/80 leading-relaxed">
              We sent a verification code to <span className="font-semibold text-white">{email}</span>. Please enter it below.
            </p>
            <div>
              <label className="block text-blue-100/90 text-xs font-normal mb-1.5 ml-1">
                Verification Code
              </label>
              <div className="bg-[#153f77]/85 border border-blue-300/20 rounded-2xl h-12 px-4 shadow-inner flex items-center">
                <input
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full bg-transparent text-white text-sm placeholder-blue-200/40 outline-none font-normal text-center tracking-widest text-lg"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-2xl bg-gradient-to-b from-[#38bdf8] to-[#0284c7] hover:brightness-110 text-white font-semibold text-sm flex items-center justify-center shadow-lg transition-all cursor-pointer"
            >
              {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Verify & Continue"}
            </button>
          </form>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* 4. DIVIDER ("OR") & SOCIAL LOGINS (GITHUB & GOOGLE ONLY)               */}
        {/* ----------------------------------------------------------------------- */}
        {!isForgotPassword && !pendingVerification && (
          <>
            {/* Divider */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="w-full border-t border-blue-300/20" />
              <span className="absolute px-3 bg-transparent text-blue-200/80 text-xs font-medium uppercase tracking-wider">
                OR
              </span>
            </div>

            {/* Social Login Buttons: GitHub & Google (Apple excluded per prompt) */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* GitHub Button */}
              <button
                type="button"
                onClick={() => handleOAuth("oauth_github", "github")}
                disabled={oauthLoading !== null}
                className="h-12 rounded-2xl bg-gradient-to-b from-white via-[#f6f9fc] to-[#e1e9f4] hover:from-white hover:to-[#d6e3f2] active:scale-95 border border-white/80 shadow-[0_6px_16px_rgba(0,0,0,0.16),inset_0_1px_1px_rgba(255,255,255,1)] flex items-center justify-center gap-2 text-slate-800 font-semibold text-sm transition-all cursor-pointer"
              >
                {oauthLoading === "github" ? (
                  <Loader2 className="size-4 animate-spin text-slate-700" />
                ) : (
                  <>
                    <svg className="size-4.5 fill-slate-900" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    <span>GitHub</span>
                  </>
                )}
              </button>

              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleOAuth("oauth_google", "google")}
                disabled={oauthLoading !== null}
                className="h-12 rounded-2xl bg-gradient-to-b from-white via-[#f6f9fc] to-[#e1e9f4] hover:from-white hover:to-[#d6e3f2] active:scale-95 border border-white/80 shadow-[0_6px_16px_rgba(0,0,0,0.16),inset_0_1px_1px_rgba(255,255,255,1)] flex items-center justify-center gap-2 text-slate-800 font-semibold text-sm transition-all cursor-pointer"
              >
                {oauthLoading === "google" ? (
                  <Loader2 className="size-4 animate-spin text-slate-700" />
                ) : (
                  <>
                    <svg className="size-4.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* 5. SWITCH TO SIGN UP / SIGN IN                                          */}
        {/* ----------------------------------------------------------------------- */}
        <div className="mt-5 text-center text-xs text-blue-100/90">
          {mode === "sign-in" ? (
            <>
              Don’t have an account?{" "}
              <Link
                href="/sign-up"
                className="text-white font-semibold underline underline-offset-2 hover:text-sky-200 ml-1 transition-colors"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-white font-semibold underline underline-offset-2 hover:text-sky-200 ml-1 transition-colors"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
