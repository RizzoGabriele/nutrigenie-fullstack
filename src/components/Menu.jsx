import { useState } from "react";
import "./Menu.css";
import Popup from "./Popup";
import { useNavigate, useLocation } from "react-router-dom";

const ICONS = {
  discover: "bi-search",
  history: "bi-clock-history",
  profile: "bi-person",
};

const TABS = [
  { id: "discover", label: "Discover", path: "/" },
  { id: "history", label: "History", path: "/history" },
  { id: "profile", label: "Profile", path: "/profile" },
];

export default function Menu() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname.toLowerCase().replace(/\/+$/, "");
  const blockedPages = {
    "/qrcode": "Are you sure you want to leave the QR Code screen?",
    "/editprofile": "You have unsaved changes. Are you sure you want to leave?",
  };
  const popupMessage = blockedPages[path];
  const isBlockedPage = Boolean(popupMessage);

  const [active, setActive] = useState("discover");
  const [showPopup, setShowPopup] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);

  const handleClick = (tab) => {
    if (isBlockedPage) {
      setPendingTab(tab);
      setShowPopup(true);
      return;
    }

    setActive(tab.id);
    navigate(tab.path);
  };

  const handleConfirm = () => {
    setShowPopup(false);
    if (pendingTab) {
      setActive(pendingTab.id);
      navigate(pendingTab.path);
    }
    setPendingTab(null);
  };

  const handleClose = () => {
    setShowPopup(false);
    setPendingTab(null);
  };

  return (
    <>
      {showPopup && (
        <Popup
          title="Warning"
          message={popupMessage}
          onClose={handleClose}
          onConfirm={handleConfirm}
        />
      )}

      <div className="bottom-menu-wrapper">
        <nav className="bottom-menu">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`bottom-menuitem ${
                active === tab.id ? "bottom-menuitem--active" : ""
              }`}
              onClick={() => handleClick(tab)}
            >
              <i className={`bi ${ICONS[tab.id]} bottom-menuicon`} />
              <span className="bottom-menu__label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
