"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitKYC, type OnboardingState } from "./actions";
import { useUser } from "@clerk/nextjs";
import { Loader2, ShieldCheck, User, Phone, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";

const initialState: OnboardingState = { status: "idle" };

// ─── Field component ──────────────────────────────────────────────────────────

function Field({
    label,
    name,
    type = "text",
    placeholder,
    hint,
    error,
    required,
    maxLength,
    pattern,
}: {
    label: string;
    name: string;
    type?: string;
    placeholder?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    maxLength?: number;
    pattern?: string;
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-green-600 ml-1">*</span>}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
                maxLength={maxLength}
                pattern={pattern}
                className={`
          w-full px-4 py-3 rounded-xl border bg-white text-gray-900
          placeholder:text-gray-400 text-sm
          transition-all duration-200 outline-none
          focus:ring-2 focus:ring-green-500 focus:border-transparent
          ${error
                        ? "border-red-400 ring-1 ring-red-300 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }
        `}
            />
            {error && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {error}
                </p>
            )}
            {hint && !error && (
                <p className="text-xs text-gray-400 mt-1">{hint}</p>
            )}
        </div>
    );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function Steps({ current, isAdmin }: { current: number; isAdmin: boolean }) {
    const steps = ["Account", "Identity", "Verify"];

    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${i < current
                                ? "bg-green-500 text-white"
                                : i === current
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-100 text-gray-400"
                            }
              `}>
                            {i + 1}
                        </div>
                        <span className="text-xs">{step}</span>
                        {isAdmin && i === 0 && (
                            <span className="ml-1 text-[10px] bg-black text-white px-2 py-0.5 rounded">
                                ADMIN
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
    const { user } = useUser();
    const isAdmin = user?.publicMetadata?.role === "admin";
    const formRef = useRef<HTMLFormElement>(null);

    const [state, formAction, isPending] = useActionState(submitKYC, initialState);

    // Redirect if already onboarded on mount
    useEffect(() => {
        if (state.status !== "success") return;
    
        async function refreshAndRedirect() {
            try {
                await user?.reload();
            } catch {
                // Non-fatal — proceed anyway
            } finally {
                window.location.href = "/dashboard";
            }
        }
    
        refreshAndRedirect();
    }, [state.status, user]);

    // ✅ After success:
// 1. user.reload() — refreshes client-side publicMetadata
// 2. fetch /api/auth/refresh — hits the server so Clerk issues
//    a fresh signed JWT cookie with onboardingComplete: true
// 3. window.location.href — full browser navigation so middleware
//    reads the new cookie, not the old cached one
useEffect(() => {
    if (state.status !== "success") return;

    async function refreshAndRedirect() {
        try {
            await user?.reload();
            await fetch("/api/auth/refresh", { credentials: "include" });
        } catch {
            // Non-fatal — proceed anyway
        } finally {
            window.location.href = "/dashboard";
        }
    }

    refreshAndRedirect();
}, [state.status, user]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4 py-12">
            <div
                className="fixed inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, #16a34a 1px, transparent 0)`,
                    backgroundSize: "32px 32px",
                }}
            />

            <div className="relative w-full max-w-lg">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-600 text-white shadow-lg shadow-green-200 mb-4">
                        <ShieldCheck className="h-7 w-7" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Complete your profile
                    </h1>
                    <p className="text-gray-500 text-sm mt-1.5 max-w-sm mx-auto">
                        We need a few details to verify your identity and keep your account secure.
                    </p>
                </div>

                <Steps current={1} isAdmin={!!isAdmin} />

                <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400" />

                    <form ref={formRef} action={formAction} className="p-8 space-y-6">

                        {state.status === "error" && !state.errors && state.message && (
                            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <p>{state.message}</p>
                            </div>
                        )}

                        {state.status === "success" && (
                            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                                <p>Profile saved! Redirecting to your dashboard…</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                <User className="h-3.5 w-3.5" />
                                Personal Information
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="First name" name="firstName" placeholder="Ada" required error={state.errors?.firstName} />
                                <Field label="Last name" name="lastName" placeholder="Okafor" required error={state.errors?.lastName} />
                            </div>
                            <Field
                                label="Phone number"
                                name="phone"
                                type="tel"
                                placeholder="0801 234 5678"
                                hint="Nigerian number — used for account alerts"
                                required
                                error={state.errors?.phone}
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-3 text-xs text-gray-400">Government ID (at least one)</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                <CreditCard className="h-3.5 w-3.5" />
                                Verification Numbers
                            </div>
                            <Field label="BVN" name="bvn" type="text" placeholder="12345678901" hint="Bank Verification Number — 11 digits" maxLength={11} pattern="\d{11}" error={state.errors?.bvn} />
                            <Field label="NIN" name="nin" type="text" placeholder="12345678901" hint="National Identification Number — 11 digits" maxLength={11} pattern="\d{11}" error={state.errors?.nin} />
                            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                                <Phone className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    Your BVN and NIN are encrypted and used only for identity verification. We never share them with third parties.
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-3 text-xs text-gray-400">Savings Group Setup</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Group Information
                            </div>
                            <Field label="Group name" name="groupName" placeholder="Family Ajo Circle" hint="This will be the name of your savings group" required error={state.errors?.groupName} />
                            <div className="flex items-start gap-2.5 p-3.5 bg-green-50 border border-green-200 rounded-xl">
                                <ShieldCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-green-700 leading-relaxed">
                                    Your first savings group will be created automatically. You can invite friends and family after onboarding.
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending || state.status === "success"}
                            className="
                w-full py-3.5 px-6 rounded-xl font-semibold text-white text-sm
                bg-green-600 hover:bg-green-700 active:bg-green-800
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200
                flex items-center justify-center gap-2
                shadow-md shadow-green-200 hover:shadow-lg hover:shadow-green-200
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              "
                        >
                            {isPending ? (
                                <><Loader2 className="h-4 w-4 animate-spin" />Saving your details…</>
                            ) : state.status === "success" ? (
                                <><Loader2 className="h-4 w-4 animate-spin" />Redirecting…</>
                            ) : (
                                "Continue to Dashboard →"
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-400">
                            You can update your information later in{" "}
                            <span className="text-green-600 font-medium">Settings → Profile</span>
                        </p>
                    </form>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    🔒 256-bit encryption · NDPR compliant
                </p>
            </div>
        </div>
    );
}