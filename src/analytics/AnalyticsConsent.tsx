"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  useState,
  type ReactNode,
} from "react";

import { canLoadGoogleTag } from "./trackingPolicy";

const storageKey = "feugee-analytics-consent";

type Consent = "accepted" | "rejected";
export type AnalyticsEvent =
  "contact_cta_click" | "email_click" | "phone_click" | "page_view";

type ConsentContextValue = {
  accepted: boolean;
  available: boolean;
  openSettings: () => void;
  track: (event: AnalyticsEvent, linkUrl?: string) => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const storedConsent = (): Consent | null => {
  try {
    const consent = window.localStorage.getItem(storageKey);
    return consent === "accepted" || consent === "rejected" ? consent : null;
  } catch {
    return null;
  }
};

const saveConsent = (consent: Consent) => {
  try {
    window.localStorage.setItem(storageKey, consent);
  } catch {
    // Keep the choice for this visit when persistent storage is unavailable.
  }
  window.dispatchEvent(new Event("feugee-consent-change"));
};

const subscribeConsent = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("feugee-consent-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("feugee-consent-change", callback);
  };
};

const subscribeHydration = () => () => {};
const isHydrated = () => true;
const isServerHydrated = () => false;

const bootstrapDataLayer = () => {
  window.dataLayer ??= [];
  if (!window.dataLayer.some((entry) => entry.event === "gtm.js")) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  }
};

const pushAnalyticsEvent = (event: AnalyticsEvent, linkUrl?: string) => {
  if (!window.dataLayer) return;
  window.dataLayer.push({
    event,
    ...(linkUrl
      ? event === "page_view"
        ? { page_location: linkUrl }
        : { link_url: linkUrl }
      : {}),
  });
};

export const useAnalyticsConsent = () => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useAnalyticsConsent must be used within AnalyticsConsent");
  }
  return context;
};

export const AnalyticsConsent = ({
  children,
  containerId,
  productionUrl,
  production,
}: {
  children: ReactNode;
  containerId: string | undefined;
  productionUrl: string;
  production: boolean;
}) => {
  const pathname = usePathname();
  const consent = useSyncExternalStore(
    subscribeConsent,
    storedConsent,
    () => null,
  );
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    isHydrated,
    isServerHydrated,
  );
  const currentUrl = hydrated
    ? new URL(`${pathname}${window.location.search}`, window.location.origin)
        .href
    : null;
  const [settingsOpen, setSettingsOpen] = useState(false);

  const trackingEnabled =
    consent === "accepted" &&
    currentUrl !== null &&
    canLoadGoogleTag({
      containerId,
      productionUrl,
      currentUrl,
      production,
      consent: true,
    });

  useEffect(() => {
    if (!trackingEnabled || !containerId || !currentUrl) return;

    bootstrapDataLayer();
    pushAnalyticsEvent("page_view", currentUrl);

    if (!document.getElementById("google-tag-manager")) {
      const script = document.createElement("script");
      script.id = "google-tag-manager";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
      document.head.appendChild(script);
    }
  }, [containerId, currentUrl, trackingEnabled]);

  const canOfferAnalytics =
    currentUrl !== null &&
    canLoadGoogleTag({
      containerId,
      productionUrl,
      currentUrl,
      production,
      consent: true,
    });

  const context: ConsentContextValue = {
    accepted: consent === "accepted",
    available: canOfferAnalytics,
    openSettings: () => {
      if (canOfferAnalytics) setSettingsOpen(true);
    },
    track: (event, linkUrl) => {
      if (
        consent === "accepted" &&
        canLoadGoogleTag({
          containerId,
          productionUrl,
          currentUrl: window.location.href,
          production,
          consent: true,
        })
      ) {
        pushAnalyticsEvent(event, linkUrl);
      }
    },
  };

  const chooseConsent = (choice: Consent) => {
    saveConsent(choice);
    setSettingsOpen(false);
    if (choice === "rejected" && consent === "accepted") {
      window.location.reload();
    }
  };

  const showPrompt = canOfferAnalytics && (consent === null || settingsOpen);

  return (
    <ConsentContext.Provider value={context}>
      {children}
      {showPrompt && (
        <aside
          aria-label="Analytics preferences"
          className="fixed inset-x-4 bottom-4 z-100 mx-auto max-w-xl rounded bg-neutral-950 p-5 text-white shadow-2xl ring-1 ring-neutral-700 sm:inset-x-auto sm:right-6 sm:bottom-6"
          role="region"
        >
          <h2 className="text-lg font-semibold">Your privacy choices</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-300">
            Optional Google Analytics helps us understand how visitors use this
            site. It loads only if you allow analytics.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              className="rounded border border-neutral-600 px-4 py-2 text-sm text-white transition hover:border-white"
              onClick={() => chooseConsent("rejected")}
              type="button"
            >
              Reject analytics
            </button>
            <button
              className="rounded bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200"
              onClick={() => chooseConsent("accepted")}
              type="button"
            >
              Allow analytics
            </button>
          </div>
        </aside>
      )}
    </ConsentContext.Provider>
  );
};
