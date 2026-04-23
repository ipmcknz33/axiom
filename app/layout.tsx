import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./global.css";
import { AiAssistant } from "@/app/components/assistant/ai-assistant";

export const metadata: Metadata = {
  title: "Axiom by IMDEV Studios",
  description:
    "Protected AI operations demo shell with centralized access and entitlement controls.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AiAssistant />
      </body>
    </html>
  );
}
