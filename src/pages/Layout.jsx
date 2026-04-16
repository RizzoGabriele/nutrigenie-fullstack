import IOSStatusBar from "../components/IOSStatusBar";
import Menu from "../components/Menu";
import { Outlet } from "react-router-dom";
import { useEffect } from "react";

export default function Layout() {
  useEffect(() => {
    let ro = null;

    const attachObserver = () => {
      const menuEl = document.querySelector(".bottom-menu-wrapper");
      if (!menuEl) return false;

      const setVar = () => {
        const h = menuEl.getBoundingClientRect().height;
        document.documentElement.style.setProperty(
          "--bottom-menu-space",
          `${Math.ceil(h)}px`,
        );
      };

      setVar();

      ro = new ResizeObserver(setVar);
      ro.observe(menuEl);

      window.addEventListener("resize", setVar);
      return true;
    };

    // aspetta che Menu sia montato
    const id = requestAnimationFrame(() => {
      const ok = attachObserver();
      if (!ok) {
        // fallback: riprova una volta dopo pochissimo
        setTimeout(() => attachObserver(), 50);
      }
    });

    return () => {
      cancelAnimationFrame(id);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", () => {});
    };
  }, []);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
      />
      <IOSStatusBar />
      <Outlet />
      <Menu />
    </>
  );
}
