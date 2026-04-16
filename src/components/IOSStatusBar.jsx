import "./IOSStatusBar.css";

export default function IOSStatusBar() {
  return (
    <div className="ios-statusbar">
      <span className="ios-time">9:41</span>

      <div className="ios-icons">
        <i className="bi-reception-4 fs-6"></i>
        <i className="bi-wifi fs-5"></i>
        <i className="bi-battery-half fs-2"></i>
      </div>
    </div>
  );
}
