"use client";

import { useEffect } from "react";
import { injectContentsquareScript } from "@contentsquare/tag-sdk";

export function Contentsquare() {
  useEffect(() => {
    injectContentsquareScript({ clientId: "cfd03185e17c2" });
  }, []);

  return null;
}