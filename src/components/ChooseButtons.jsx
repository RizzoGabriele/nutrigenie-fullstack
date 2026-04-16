import "./ChooseButtons.css";

export default function ChooseButtons({onReject, onAccept, onBack, disableBack}) {

  return (
    <div className="circle-buttons">
      <button className="circle-btn red-btn" onClick={onReject}>
        ✕
      </button>
      <button className="circle-btn small-btn yellow-btn" onClick={onBack} disabled={disableBack}>
        ↺
      </button>
      <button className="circle-btn green-btn" onClick={onAccept}>
        ✓
      </button>
    </div>
  );
}
