"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/** Renders children at the end of <body>, outside any transformed or clipped parent. */
export function Portal({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  return mounted ? createPortal(children, document.body) : null;
}
