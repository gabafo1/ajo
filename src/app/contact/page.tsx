"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrMsg(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setStatus("ok");
      setName("");
      setEmail("");
      setMessage("");
    } catch (e) {
      setStatus("err");
      setErrMsg(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Contact</h1>
        <p className="text-gray-600 text-sm mb-6">
          Send a message to the Balajo team. Requires{" "}
          <code className="text-xs bg-gray-100 px-1 rounded">RESEND_API_KEY</code>{" "}
          and <code className="text-xs bg-gray-100 px-1 rounded">CONTACT_INBOX_EMAIL</code>{" "}
          in your environment.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          {errMsg && <p className="text-sm text-red-600">{errMsg}</p>}
          {status === "ok" && (
            <p className="text-sm text-green-700">Message sent. Thank you.</p>
          )}
          <Button type="submit" disabled={status === "sending"} className="w-full">
            {status === "sending" ? "Sending…" : "Send"}
          </Button>
        </form>

        <Link href="/" className="text-primary text-sm underline mt-8 inline-block">
          Home
        </Link>
      </div>
    </main>
  );
}
