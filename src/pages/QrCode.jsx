import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Popup from "../components/Popup";
import "./QrCode.css";
import QRCode from "react-qr-code";
import BackButton from "../components/BackButton";

export default function QrCode() {
  const location = useLocation();
  const origin = window.location.origin;
  const navigate = useNavigate();

  const [showBackPopup, setShowBackPopup] = useState(false);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const [pollErrorCount, setPollErrorCount] = useState(0);

  const { lat, lng, name, mealId, typeMealId } = location.state || {};
  useEffect(() => {
    if (!mealId) return;

    let stopped = false;

    const interval = setInterval(async () => {
      if (stopped) return;

      try {
        const res = await fetch(`/api/meal/${mealId}/completed`);
        if (res.status === 404) {
          return;
        }

        if (!res.ok) {
          if (res.status >= 500) setPollErrorCount((c) => c + 1);
          return;
        }
        setPollErrorCount(0);

        const data = await res.json();
        if (data?.completed) {
          stopped = true;
          clearInterval(interval);
          navigate("/", { state: { toast: { message: "Order completed!" } } });
        }
      } catch (e) {
        setPollErrorCount((c) => c + 1);
      }
    }, 1200);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [mealId, navigate]);

  const handleBackClick = () => {
    setShowBackPopup(true);
  };

  const handleConfirmBack = () => {
    setShowBackPopup(false);
    navigate(-1);
  };

  const handleCloseBackPopup = () => {
    setShowBackPopup(false);
  };

  const handleDownload = () => {
    const svg = document.querySelector(".qr-wrapper svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    const link = document.createElement("a");
    link.href = svgUrl;
    link.download = "MyMeal_QrCode.svg";
    link.click();

    URL.revokeObjectURL(svgUrl);
    setShowDownloadPopup(true);
  };

  return (
    <div className="qrcode-page">
      <div className="firstLine">
        <BackButton onClick={handleBackClick} />
      </div>

      <h1 className="page-title">Your QR Code</h1>

      <div className="rest-info-container">
        <div className="maps-box liquid-glass">
          {name && <div className="maps-label">📍 {name}</div>}

          {lat && lng && (
            <iframe
              width="100%"
              height="180"
              style={{ border: 0, display: "block" }}
              loading="lazy"
              allowFullScreen
              src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
            ></iframe>
          )}
        </div>

        <div className="qr-container-glass liquid-glass">
          <div className="scan-qr-text">
            <p>Show the QR code to start your order preparation. 🍽️</p>
          </div>

          <div className="qr-wrapper">
            <QRCode
              className="qr-image-content"
              value={`${origin}/${mealId}/${typeMealId}/confirm`}
              size={150}
              bgColor="transparent"
            />
          </div>

          <div className="download-area">
            <span
              className="bi bi-download download-btn-icon"
              onClick={handleDownload}
              role="button"
              aria-label="Download QR Code"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleDownload();
              }}
            ></span>
            <p className="download-text">Save to Gallery</p>
          </div>
          {pollErrorCount >= 5 && (
            <p style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              Having trouble checking completion status. Please ensure you’re
              online.
            </p>
          )}
        </div>
      </div>

      {showBackPopup && (
        <Popup
          title="Warning"
          message="Are you sure you want to leave the QR Code screen?"
          onClose={handleCloseBackPopup}
          onConfirm={handleConfirmBack}
        />
      )}

      {showDownloadPopup && (
        <Popup
          title="Saved ✅"
          message="The QR code has been saved to your gallery."
          onClose={() => setShowDownloadPopup(false)}
        />
      )}
    </div>
  );
}
