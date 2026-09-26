type TrackingPolicyInput = {
  containerId: string | undefined;
  productionUrl: string;
  currentUrl: string;
  production: boolean;
  consent: boolean;
};

export const canLoadGoogleTag = ({
  containerId,
  productionUrl,
  currentUrl,
  production,
  consent,
}: TrackingPolicyInput): boolean => {
  if (!containerId || !production || !consent) return false;

  try {
    const productionOrigin = new URL(productionUrl).origin;
    const current = new URL(currentUrl);
    const pathSegments = current.pathname.split("/").filter(Boolean);
    const isWorkPreview =
      pathSegments.length === 3 &&
      pathSegments[0] === "works" &&
      pathSegments[2] === "preview";
    const isLivePreview = current.searchParams.has("livePreview");

    return (
      current.origin === productionOrigin &&
      current.protocol === "https:" &&
      !isWorkPreview &&
      !isLivePreview
    );
  } catch {
    return false;
  }
};
