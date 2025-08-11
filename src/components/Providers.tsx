"use client";

import React from "react";
import { App } from "konsta/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <App theme="ios" safeAreas>
      {children}
    </App>
  );
}
