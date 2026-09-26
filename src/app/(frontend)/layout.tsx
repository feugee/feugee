import type { Metadata } from "next";
import { albertSans } from "@/app/fonts";
import { env } from "@/env";
import "../globals.css";

import { Cursor } from "@/components/Cursor";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/page-transition/PageTransition";
import { SmoothScroll } from "@/components/SmoothScroll";

export const metadata: Metadata = {
  // The production URL from the env — the base every page's relative
  // canonical/OG URL composes against (see src/seo/metadata.ts).
  metadataBase: new URL(env.NEXT_PUBLIC_SERVER_URL),
  title: "Feugee",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${albertSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-neutral-950">
        <SmoothScroll>
          <PageTransition />
          {/* Outside the Blackout slab, so the Page Shift never drags it —
              the Cursor stays viewport-pinned like the pointer it replaces. */}
          <Cursor />
          <Navbar />
          {/* Every page's primary content sits in one main landmark; page
              views contribute sections, not their own main. The data
              attribute marks the Page Shift slab (ADR 0007). */}
          <main className="flex flex-1 flex-col" data-blackout-slab>
            {children}
          </main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
