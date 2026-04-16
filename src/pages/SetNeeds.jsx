import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./SetNeeds.css";
import BackButton from "../components/BackButton";
import { useMacros } from "../pages/MacrosContext";
import Popup from "../components/Popup";

const SetNeeds = () => {
  const navigate = useNavigate();
  const { mealDraft } = useMacros();
  const currentUserEmail = "sara.rossi@gmail.com";

  const [allOptions, setAllOptions] = useState([]);

  const [needs, setNeeds] = useState({
    vegan: false,
    halal: false,
    vegetarian: true,
    others: [],
  });

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupData, setPopupData] = useState({
    title: "",
    message: "",
  });

  const [showToast, setShowToast] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const EXCLUDED = useMemo(() => new Set(["vegan", "halal", "vegetarian"]), []);
  
  const dropdownOptions = useMemo(() => {
    return allOptions.filter(
      (o) => !EXCLUDED.has(String(o.name).toLowerCase())
    );
  }, [allOptions, EXCLUDED]);

  const dropdownSelectedIds = useMemo(() => {
    if (!Array.isArray(needs.others) || dropdownOptions.length === 0) return [];
    const allowed = new Set(dropdownOptions.map((o) => o.id));
    return needs.others.filter((id) => allowed.has(id));
  }, [needs.others, dropdownOptions]);

  useEffect(() => {
    fetch("/api/preferences")
      .then((res) => res.json())
      .then((data) => setAllOptions(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Fetch preferences error:", err));

    fetch(`/api/user/${currentUserEmail}/allergies`)
      .then((res) => res.json())
      .then((ids) =>
        setNeeds((prev) => ({
          ...prev,
          others: Array.isArray(ids) ? ids : [],
        }))
      )
      .catch((err) => console.error("Fetch user allergies error:", err));

    fetch(`/api/user/${currentUserEmail}/allergies/names`)
      .then((res) => res.json())
      .then((names) => {
        const set = new Set((names || []).map((n) => String(n).toLowerCase()));
        setNeeds((prev) => ({
          ...prev,
          vegan: set.has("vegan"),
          halal: set.has("halal"),
          vegetarian: set.has("vegetarian") || set.has("vegan"), // Coerenza al caricamento
        }));
      })
      .catch((err) => console.error("Fetch user allergies names error:", err));
  }, []);

  useEffect(() => {
    const handleOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, []);

  // NUOVA FUNZIONE TOGGLE CON LOGICA DI IMPLICAZIONE
  const toggle = (key) => {
    setNeeds((prev) => {
      const newValue = !prev[key];

      // Se attivo Vegan, deve attivarsi anche Vegetarian
      if (key === "vegan" && newValue === true) {
        return { ...prev, vegan: true, vegetarian: true };
      }

      // Se disattivo Vegetarian, deve disattivarsi anche Vegan
      if (key === "vegetarian" && newValue === false) {
        return { ...prev, vegetarian: false, vegan: false };
      }

      // Comportamento normale per gli altri casi
      return { ...prev, [key]: newValue };
    });
  };

  const toggleOther = (id) => {
    const opt = allOptions.find((o) => o.id === id);
    if (opt && EXCLUDED.has(String(opt.name).toLowerCase())) return;

    setNeeds((prev) => {
      const exists = prev.others.includes(id);
      return {
        ...prev,
        others: exists
          ? prev.others.filter((x) => x !== id)
          : [...prev.others, id],
      };
    });
  };

  const handleSave = async () => {
    localStorage.setItem("userNutritionNeeds", JSON.stringify(needs));
    const nameToId = new Map(
      allOptions.map((o) => [String(o.name).toLowerCase(), o.id])
    );

    const extraIds = [];
    if (needs.vegan && nameToId.has("vegan"))
      extraIds.push(nameToId.get("vegan"));
    if (needs.halal && nameToId.has("halal"))
      extraIds.push(nameToId.get("halal"));
    if (needs.vegetarian && nameToId.has("vegetarian"))
      extraIds.push(nameToId.get("vegetarian"));
    
    const selectedAllergyIds = Array.from(
      new Set([...dropdownSelectedIds, ...extraIds])
    );

    try {
      const payload = { email: currentUserEmail, selectedAllergyIds };
      const response = await fetch("/api/user/allergens/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Save error:", await response.text());
        return;
      }
    } catch (err) {
      console.error("Save error:", err);
      return;
    }

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const calcMacroPct = (m) => {
    const carbsKcal = (Number(m.carbo) || 0) * 4;
    const proteinsKcal = (Number(m.proteins) || 0) * 4;
    const fatsKcal = (Number(m.fat) || 0) * 9;
    const total = carbsKcal + proteinsKcal + fatsKcal;
    if (!total) return { carbsPct: 0, proteinsPct: 0, fatsPct: 0 };
    return {
      carbsPct: (carbsKcal / total) * 100,
      proteinsPct: (proteinsKcal / total) * 100,
      fatsPct: (fatsKcal / total) * 100,
    };
  };

  const handleNext = async () => {
    try {
      const res = await fetch("/api/meals");
      if (!res.ok) throw new Error("Failed to fetch meals list");
      const meals = await res.json();
      const POSITIVE_IDS = [1, 2, 3, 4, 5, 17, 18, 19, 20, 21, 22, 23, 24, 25];
      
      let userWantsIds = [...(needs.others || [])];
      if (needs.vegan) userWantsIds.push(18);
      if (needs.vegetarian) userWantsIds.push(17);  
      if (needs.halal) userWantsIds.push(20); 
      userWantsIds = [...new Set(userWantsIds)];

      const filterType = mealDraft?.mealTime || "main";
      const targetKcal = Number(mealDraft?.kcal) || 0;
      const targetCarbsPct = Number(mealDraft?.carbsPct);
      const targetProteinsPct = Number(mealDraft?.proteinsPct);
      const targetFatsPct = Number(mealDraft?.fatsPct);
      const kcalTol = 0.2;
      const macroTol = 30; 

      const minKcal = targetKcal * (1 - kcalTol);
      const maxKcal = targetKcal * (1 + kcalTol);

      const candidates = (Array.isArray(meals) ? meals : [])
        .map((m) => {
          const kcal = Number(m.calorie) || 0;
          const pct = calcMacroPct(m);

          const okKcal = targetKcal > 0 ? kcal >= minKcal && kcal <= maxKcal : true;
          const okMacros =
            Math.abs(pct.carbsPct - targetCarbsPct) <= macroTol &&
            Math.abs(pct.proteinsPct - targetProteinsPct) <= macroTol &&
            Math.abs(pct.fatsPct - targetFatsPct) <= macroTol;

          const kcalScore = targetKcal > 0 ? Math.abs(kcal - targetKcal) / targetKcal : 0;
          const macroScore =
            (Math.abs(pct.carbsPct - targetCarbsPct) +
              Math.abs(pct.proteinsPct - targetProteinsPct) +
              Math.abs(pct.fatsPct - targetFatsPct)) /
            100;
          const okTime = m.meal_time === filterType;
          let okPreferences = true;
          const mealPrefIds = Array.isArray(m.pref_ids) ? m.pref_ids : [];

          for (const reqId of userWantsIds) {
            if (POSITIVE_IDS.includes(reqId)) {
              if (!mealPrefIds.includes(reqId)) {
                okPreferences = false;
                break; 
              }
            } else {
              if (mealPrefIds.includes(reqId)) {
                okPreferences = false;
                break; 
              }
            }
          }
          return {
            ...m,
            _ok: okKcal && okMacros && okTime && okPreferences,
            _score: kcalScore * 2 + macroScore,
          };
        })
        .filter((m) => m._ok)
        .sort((a, b) => a._score - b._score);

      if (candidates.length === 0) {
        setPopupData({
          title: "No matching dishes",
          message: "No matching dishes. Try adjusting macros or preferences.",
        });
        setPopupOpen(true);
        return;
      }

      const chosen = candidates[0];
      navigate(`/meal/${chosen.id}`, {
        state: { candidates: candidates },
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className={`toast-message ${showToast ? "show" : ""}`}>
        <i className="bi bi-check-circle-fill" style={{ color: "#34c759" }}></i>
        <span>Preferences saved!</span>
      </div>
      {popupOpen && (
        <Popup
          title={popupData.title}
          message={popupData.message}
          onClose={() => setPopupOpen(false)}
        />
      )}
      <div className="firstLine">
        <BackButton />
      </div>

      <div className="my-page">
        <h1 className="page-title">Needs</h1>
        <div className="select-my-box">
          <div className="needs-card">
            <div className="toggle-row">
              <span>Vegan</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={needs.vegan}
                  onChange={() => toggle("vegan")}
                />
                <span className="slider-switch"></span>
              </label>
            </div>

            <div className="toggle-row">
              <span>Halal</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={needs.halal}
                  onChange={() => toggle("halal")}
                />
                <span className="slider-switch"></span>
              </label>
            </div>

            <div className="toggle-row">
              <span>Vegetarian</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={needs.vegetarian}
                  onChange={() => toggle("vegetarian")}
                />
                <span className="slider-switch"></span>
              </label>
            </div>
            
            <div className="field">
              <label>Others</label>
              <div className="custom-select-wrapper" ref={dropdownRef}>
                <div
                  className={`custom-select-header ${isDropdownOpen ? "open" : ""}`}
                  onClick={() => setIsDropdownOpen((v) => !v)}
                >
                  <span>
                    {dropdownSelectedIds.length === 0
                      ? "Select options..."
                      : dropdownSelectedIds.length === 1
                      ? dropdownOptions.find((o) => o.id === dropdownSelectedIds[0])?.name ?? "1 selected"
                      : `${dropdownSelectedIds.length} selected`}
                  </span>
                  <i className={`bi bi-chevron-${isDropdownOpen ? "up" : "down"}`}></i>
                </div>

                {isDropdownOpen && (
                  <div className="custom-select-options" onPointerDown={(e) => e.stopPropagation()}>
                    {dropdownOptions.length > 0 ? (
                      dropdownOptions.map((opt) => {
                        const selected = dropdownSelectedIds.includes(opt.id);
                        return (
                          <div
                            key={opt.id}
                            className={`custom-option ${selected ? "selected" : ""}`}
                            onClick={() => toggleOther(opt.id)}
                          >
                            <span style={{ marginRight: 10 }}>{selected ? "✔" : ""}</span>
                            {opt.name}
                          </div>
                        );
                      })
                    ) : (
                      <div className="custom-option">Loading options...</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="action-buttons" style={{ gap: "15px" }}>
            <button className="btn-secondary" onClick={handleSave}>
              SAVE AS DEFAULT
            </button>
            <button
              className="custom-btn"
              style={{ flex: 1, padding: "15px" }}
              onClick={handleNext}
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SetNeeds;