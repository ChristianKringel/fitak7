"use client";

import { useState } from "react";

import { primaryButton } from "./styles";

export function ShareButton({ text, label = "Compartilhar resultado" }: { text: string; label?: string }) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function share() {
    // Native share sheet on phones; clipboard elsewhere.
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ text });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setFeedback("Copiado!");
    } catch {
      setFeedback("Não foi possível copiar.");
    }
    setTimeout(() => setFeedback(null), 2000);
  }

  return (
    <button type="button" onClick={share} className={`${primaryButton} w-full`}>
      {feedback ?? label}
    </button>
  );
}
