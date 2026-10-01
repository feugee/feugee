import { getFooterGlobal } from "./footer-data";
import { NavbarBar } from "./NavbarBar";
import { toMenuLinks } from "./menu";

// Mounted in the frontend root layout, so every public page shares it. The
// Menu's links come from the Footer global — one CMS list drives both — and
// its foot's Social Links ride the same read. Both go down as plain data:
// the Social Link icons resolve inside the Menu, since components can't
// cross the server/client boundary.
export const Navbar = async () => {
  const footer = await getFooterGlobal();

  return (
    <NavbarBar
      links={toMenuLinks(footer?.menuLinks)}
      socialLinks={footer?.socialLinks}
    />
  );
};
