import { getFooterGlobal } from "./footer-data";
import { NavbarBar } from "./NavbarBar";
import { toMenuLinks } from "./menu";

// Mounted in the frontend root layout, so every public page shares it. The
// Menu's links come from the Footer global — one CMS list drives both —
// passed into the client shell as plain data.
export const Navbar = async () => {
  const footer = await getFooterGlobal();
  const menuLinks = toMenuLinks(footer?.menuLinks);

  return <NavbarBar links={menuLinks} />;
};
