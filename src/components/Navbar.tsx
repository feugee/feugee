import { getFooterGlobal } from "./footer-data";
import { LogoLink } from "./LogoLink";
import { NavbarBar } from "./NavbarBar";
import { Menu, toMenuLinks } from "./menu";

// Mounted in the frontend root layout, so every public page shares it. The
// Menu's links come from the Footer global — one CMS list drives both.
export const Navbar = async () => {
  const footer = await getFooterGlobal();
  const menuLinks = toMenuLinks(footer?.menuLinks);

  return (
    <NavbarBar>
      <LogoLink />
      {menuLinks.length > 0 && <Menu links={menuLinks} />}
    </NavbarBar>
  );
};
