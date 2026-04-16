import "./Popup.css";

export default function Popup({
  title,
  message,
  onClose,
  onConfirm, 
  confirmText = "Leave",
  cancelText = "No",
}) {
  const isConfirm = typeof onConfirm === "function";

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <h3>{title}</h3>
        <p>{message}</p>

        <div className="popup-actions">
          {isConfirm ? (
            <div className="popup-actions">
              <button
                className="popup-btn popup-btn--secondary"
                onClick={onClose}
              >
                {cancelText}
              </button>

              <button
                className="popup-btn popup-btn--primary"
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          ) : (
            <button className="popup-btn" onClick={onClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
