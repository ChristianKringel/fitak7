// Shared class names for buttons and cards ("Fita K7" style).

const keyBase =
  "key inline-flex min-h-[54px] items-center whitespace-nowrap justify-center gap-2 rounded-xl border-2 border-ink px-5 text-[15px] font-extrabold disabled:cursor-default disabled:opacity-60";

/** Yellow deck key: the main action of a screen. */
export const primaryButton = `${keyBase} bg-tape-yellow text-ink shadow-[0_4px_0_var(--key-shadow)] hover:bg-[#ffe47a]`;

/** Paper deck key. */
export const secondaryButton = `${keyBase} bg-paper text-ink shadow-[0_4px_0_var(--key-shadow)] hover:bg-white`;

/** Black deck key, used on top of colored cassettes. */
export const inkButton = `${keyBase} bg-ink text-[#f4ead5] shadow-[0_4px_0_rgba(0,0,0,0.55)]`;

/** Panel on the page background. */
export const card = "rounded-2xl border-2 border-line bg-surface/40 p-4";

/** Paper label, like the sticker on a cassette. */
export const paperLabel = "rounded-[10px] border-2 border-ink bg-paper text-ink";
