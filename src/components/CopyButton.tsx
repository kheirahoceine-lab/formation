"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access denied; nothing to do
    }
  }

  return (
    <button
      onClick={copy}
      type="button"
      className="rounded-lg bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark"
    >
      {copied ? "تم النسخ ✓" : "نسخ الرابط"}
    </button>
  );
}
