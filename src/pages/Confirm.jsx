import { useParams } from "react-router-dom";
import { useState } from "react";
import "./Confirm.css";

export default function Confirm() {
  const { mealId, typeMealId } = useParams();
  const [status, setStatus] = useState("idle");

  const handleConfirm = async () => {
    setStatus("loading");

    try {
      const res = await fetch(
        `/api/meal/${mealId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            typeMeal: typeMealId,
          }),
        }
      );

      if (!res.ok) throw new Error();

      setStatus("done");
    } catch (e) {
      setStatus("error");
    }
  };

  return (
    <div className="confirm-container">
      <h2 className="confirm-title">
        Confirm Order
      </h2>

      {status === "idle" && (
        <>
          <p className="confirm-text"> Please confirm that the meal has been prepared and delivered.</p>
          <button className="confirm-btn  confirm-btn-primary" onClick={handleConfirm}>
            Confirm
          </button>
        </>
      )}

      {status === "loading" && <p>Processing...</p>}

      {status === "done" && (
        <p className="m-success">✅ Order confirmed successfully!</p>
      )}

      {status === "error" && (
        <p className="m-error">❌ Error. Please try again.</p>
      )}
    </div>
  );
}