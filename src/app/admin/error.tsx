"use client";

/* Without this boundary any render error inside /admin escapes to Next's
   global handler, which shows only "a client-side exception has occurred".
   Keep the message on screen so the kitchen can report what broke. */

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center rounded-[24px] bg-white px-6 py-16 text-center shadow-soft">
      <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-red-50 text-red-500">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <p className="mt-4 text-[14.5px] font-bold text-ink-900">
        Something went wrong on this page
      </p>
      <p className="mt-1 max-w-[380px] break-words text-[12.5px] text-ink-500">
        {error.message || "An unexpected error occurred."}
      </p>
      {error.digest && (
        <p className="mt-1 font-display text-[11px] font-bold tracking-wide text-ink-300">
          {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-4 flex h-10 items-center justify-center rounded-xl bg-ink-900 px-5 text-[12.5px] font-bold text-white transition-all hover:bg-ink-700 active:scale-95"
      >
        Try again
      </button>
    </div>
  );
}
