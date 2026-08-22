"use client";

import React from "react";
import { CreditCard, Clock, Coins } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const BillingPage = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-16 shadow-2xs min-h-[calc(100vh-120px)] flex items-center justify-center text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="size-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto shadow-xs">
          <CreditCard className="size-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <Clock className="size-3.5" />
            <span>Coming Soon</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Billing & Subscriptions
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Manage your AI tokens, purchase credits, and configure team workspace subscriptions.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/dashboard">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 h-10 text-sm font-medium transition-colors shadow-2xs">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
