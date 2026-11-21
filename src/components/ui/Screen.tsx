import type { ReactNode } from "react";

export default function Screen({ children }: { children: ReactNode }) {
  return <div style={{ animation: "screen-in 220ms cubic-bezier(0.19,1,0.22,1)" }}>{children}</div>;
}
