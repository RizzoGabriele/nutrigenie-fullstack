import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Home.css";
import { useMacros } from "./MacrosContext";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { macros: data, loading, error, setMeal, refreshMacros } = useMacros();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    refreshMacros();
  }, [refreshMacros]);

  useEffect(() => {
    const toast = location.state?.toast;
    if (!toast) return;
    setToastMessage(toast.message || "Done!");
    setShowToast(true);
    window.history.replaceState({}, document.title);
    const t = setTimeout(() => setShowToast(false), 2500);
    return () => clearTimeout(t);
  }, [location.state]);

  useEffect(() => {
    const scroller = document.getElementById("root");
    scroller?.classList.add("no-scroll");
    return () => scroller?.classList.remove("no-scroll");
  }, []);

  if (loading)
    return (
      <div className="home-page">
        <p>Caricamento...</p>
      </div>
    );

  if (error)
    return (
      <div className="home-page">
        <p>Errore: {error}</p>
      </div>
    );

  const caloriesLeft = data?.caloriesLeft ?? 0;
  const totalCalories = data?.totalCalories ?? 1;
  const caloriePercent = ((totalCalories - caloriesLeft) / totalCalories) * 100;
  const macroBars = [
    {
      label: "Carbs",
      value: data.carbsTotal - data.carbsLeft,
      max: data.carbsTotal,
    },
    {
      label: "Proteins",
      value: data.proteinTotal - data.proteinLeft,
      max: data.proteinTotal,
    },
    {
      label: "Fats",
      value: data.fatsTotal - data.fatsLeft,
      max: data.fatsTotal,
    },
  ];

  return (
    <div className="home-page">
      <h1 className="page-title">Today</h1>
      <div className="liquid-glass home-card">
        <div className="calorie-wrapper">
          <svg className="calorie-ring" viewBox="0 0 200 100">
            <path d="M10,100 A90,90 0 0,1 190,100" className="calorie-bg" />
            <path
              d="M10,100 A90,90 0 0,1 190,100"
              className="calorie-progress"
              style={{
                strokeDasharray: 283,
                strokeDashoffset: 283 - (283 * caloriePercent) / 100,
              }}
            />
          </svg>

          <div className="calorie-text">
            <h1>{caloriesLeft}</h1>
            <p>left of {totalCalories} kcal</p>
          </div>
        </div>

        <div className="macro-container">
          {macroBars.map((m) => {
            const percent = m.max > 0 ? (m.value / m.max) * 100 : 0;
            const isOverLimit = m.value > m.max;
            return (
              <div key={m.label} className="macro-box">
                <span className={isOverLimit ? "over-limit" : ""}>
                  {m.label}
                </span>
                <strong className={isOverLimit ? "over-limit" : ""}>
                  {Math.round(m.value)}/{m.max}g
                </strong>
                <div className="macro-bar">
                  <div
                    className={`macro-fill ${isOverLimit ? "over-limit" : ""}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="liquid-glass home-card">
        <h3 className="section-title">Meals</h3>
        {["Breakfast", "Lunch", "Dinner"].map((mealName, index) => {
          const filterType = mealName === "Breakfast" ? "breakfast" : "main";
          return (
            <div key={mealName} className="meal-row">
              <span>{mealName}</span>
              <button
                className="add-btn"
                onClick={() => {
                  setMeal(index + 1);
                  navigate("/ChooseCalories", {
                    state: { mealTime: filterType },
                  });
                }}
              >
                <i className="bi bi-plus-lg"></i>
              </button>
            </div>
          );
        })}
      </div>
      <div className={`toast-message ${showToast ? "show" : ""}`}>
        <i className="bi bi-check-circle-fill" style={{ color: "#34c759" }}></i>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}

export default Home;
