import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Popup from "../components/Popup";
import "./ChooseCalories.css";
import BackButton from "../components/BackButton";
import { useMacros } from "./MacrosContext";

const ChooseCalories = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { macros, meal, setMeal, mealDraft, setMealDraft } = useMacros();
  const currentMealTime = state?.mealTime || mealDraft?.mealTime || "main";
  useEffect(() => {
    if (state?.meal) setMeal(state.meal);
  }, [state?.meal, setMeal]);
  const defaultKcal = useMemo(() => {
    return macros?.caloriesLeft ?? 0;
  }, [macros]);
  const [kcal, setKcal] = useState(mealDraft?.kcal ?? defaultKcal);
  const [carbs, setCarbs] = useState(mealDraft?.carbsPct ?? 50);
  const [proteins, setProteins] = useState(mealDraft?.proteinsPct ?? 30);
  const [fats, setFats] = useState(mealDraft?.fatsPct ?? 20);
  const [showInfo, setShowInfo] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showExceed, setShowExceed] = useState(false);
  const [exceedMsg, setExceedMsg] = useState("");
  useEffect(() => {
    setKcal(mealDraft?.kcal ?? defaultKcal);
  }, [defaultKcal]); 
  useEffect(() => {
    if (!setMealDraft) return;
    setMealDraft({
      meal: meal ?? null,
      kcal: kcal === "" ? "" : Number(kcal),
      carbsPct: Number(carbs),
      proteinsPct: Number(proteins),
      fatsPct: Number(fats),

      mealTime: currentMealTime
    });
  }, [meal, kcal, carbs, proteins, fats, setMealDraft, currentMealTime]);

  const calculateGrams = (percent, type) => {
    const n = Number(kcal);
    if (!n || Number.isNaN(n) || n <= 0) return 0;
    const caloriesFromMacro = (n * percent) / 100;
    const divisor = type === "fats" ? 9 : 4;
    return Math.round(caloriesFromMacro / divisor);
  };

  const handleKcalChange = (value) => {
    if (value === "") {
      setKcal("");
      return;
    }

    const n = Number(value);

    if (Number.isNaN(n)) {
      setKcal("");
      return;
    }

    if (defaultKcal > 0 && n > defaultKcal) {
      setKcal(0); 
      setExceedMsg(`You can't exceed ${defaultKcal} kcal (left today).`);
      setShowExceed(true);
      return;
    }

    setKcal(n);
  };

  const handleSliderChange = (type, value) => {
    const nKcal = Number(kcal);
    if (!nKcal || Number.isNaN(nKcal) || nKcal <= 0) return;

    let newVal = parseInt(value, 10);
    newVal = Math.max(0, Math.min(100, newVal));
    const remaining = 100 - newVal;

    if (type === "carbs") {
      setCarbs(newVal);
      const totalOther = proteins + fats;
      if (totalOther === 0) {
        setProteins(Math.floor(remaining / 2));
        setFats(remaining - Math.floor(remaining / 2));
      } else {
        const p = Math.round((proteins / totalOther) * remaining);
        setProteins(p);
        setFats(remaining - p);
      }
    }

    if (type === "proteins") {
      setProteins(newVal);
      const totalOther = carbs + fats;
      if (totalOther === 0) {
        setCarbs(Math.floor(remaining / 2));
        setFats(remaining - Math.floor(remaining / 2));
      } else {
        const c = Math.round((carbs / totalOther) * remaining);
        setCarbs(c);
        setFats(remaining - c);
      }
    }

    if (type === "fats") {
      setFats(newVal);
      const totalOther = carbs + proteins;
      if (totalOther === 0) {
        setCarbs(Math.floor(remaining / 2));
        setProteins(remaining - Math.floor(remaining / 2));
      } else {
        const c = Math.round((carbs / totalOther) * remaining);
        setCarbs(c);
        setProteins(remaining - c);
      }
    }
  };

  const handleNext = () => {
    const MIN_KCAL = 50;
    const n = Number(kcal);

    if (!n || Number.isNaN(n) || n < MIN_KCAL) {
      setShowError(true);
      return;
    }

    if (defaultKcal > 0 && n > defaultKcal) {
      setKcal(0);
      setExceedMsg(`You can't exceed ${defaultKcal} kcal (left today).`);
      setShowExceed(true);
      return;
    }

    navigate("/SetNeeds", {
       state: { mealTime: currentMealTime }
    });
  };

  const slidersDisabled = !Number(kcal) || Number(kcal) <= 0;


  return (
    <>
      {showInfo && (
        <Popup
          title="Smart Calculation ⚙️"
          message="Adjust any slider, and the others will automatically update to keep the total at 100%."
          onClose={() => setShowInfo(false)}
        />
      )}
      {showError && (
        <Popup
          title="Be careful ⚠️"
          message="The caloric intake is too low for a meal. Please enter at least 50 kcal."
          onClose={() => setShowError(false)}
        />
      )}
      {showExceed && (
        <Popup
          title="Too many calories ⚠️"
          message={exceedMsg || "You can't exceed the calories left today."}
          onClose={() => setShowExceed(false)}
        />
      )}

      <div className="firstLine">
        <BackButton />
        <i
          className="bi-info-circle info-icon"
          onClick={() => setShowInfo(true)}
        />
      </div>

      <div className="my-page">
        <h1 className="page-title">Nutrition Goals</h1>

        <div className="select-my-box">
          <div className="liquid-glass my-card-glass">
            
            <div className="kcal-wrapper">
              <input
                type="number"
                className="kcal-input-glass"
                placeholder="0"
                value={kcal}
                min={0}
                max={defaultKcal || undefined}
                onChange={(e) => handleKcalChange(e.target.value)}
              />
              <span className="kcal-unit">Kcal</span>
            </div>

            <div className="slider-container">
              <div className="slider-labels">
                <span>Carbs</span>
                <span className="text-carbs">
                  {carbs}% ({calculateGrams(carbs, "carbs")}g)
                </span>
              </div>
              <div className="slider-wrapper">
                <span>0%</span>
                <input
                  type="range"
                  className="range-slider slider-carbs"
                  min="0"
                  max="100"
                  value={carbs}
                  disabled={slidersDisabled}
                  onChange={(e) => handleSliderChange("carbs", e.target.value)}
                />
                <span>100%</span>
              </div>
            </div>

            <div className="slider-container">
              <div className="slider-labels">
                <span>Proteins</span>
                <span className="text-proteins">
                  {proteins}% ({calculateGrams(proteins, "proteins")}g)
                </span>
              </div>
              <div className="slider-wrapper">
                <span>0%</span>
                <input
                  type="range"
                  className="range-slider slider-proteins"
                  min="0"
                  max="100"
                  value={proteins}
                  disabled={slidersDisabled}
                  onChange={(e) => handleSliderChange("proteins", e.target.value)}
                />
                <span>100%</span>
              </div>
            </div>

            <div className="slider-container" style={{ marginBottom: 0 }}>
              <div className="slider-labels">
                <span>Fats</span>
                <span className="text-fats">
                  {fats}% ({calculateGrams(fats, "fats")}g)
                </span>
              </div>
              <div className="slider-wrapper">
                <span>0%</span>
                <input
                  type="range"
                  className="range-slider slider-fats"
                  min="0"
                  max="100"
                  value={fats}
                  disabled={slidersDisabled}
                  onChange={(e) => handleSliderChange("fats", e.target.value)}
                />
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="custom-btn"
              onClick={handleNext}
              disabled={slidersDisabled}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChooseCalories;