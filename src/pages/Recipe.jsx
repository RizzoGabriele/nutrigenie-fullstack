import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMacros } from "./MacrosContext";
import "./Recipe.css";
import BackButton from "../components/BackButton";

function Recipe() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { meal, refreshMacros } = useMacros();
  const [recipeData, setRecipeData] = useState(null);
  const [openStep, setOpenStep] = useState(null);
  const [showIngredients, setShowIngredients] = useState(false);

  const headerRef = useRef(null);

  const userEmail = "sara.rossi@gmail.com";

  useEffect(() => {
    fetch(`/api/meal/${id}/recipe`)
      .then((res) => {
        if (!res.ok) throw new Error("Errore nel caricamento della ricetta");
        return res.json();
      })
      .then((data) => {
        setRecipeData(data);
      })
      .catch((err) => console.error("Errore fetch ricetta:", err));
  }, [id]);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const setVar = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        "--recipe-header-height",
        `${Math.ceil(h)}px`,
      );
    };

    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);

    window.addEventListener("resize", setVar);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setVar);
    };
  }, []);

  const handleComplete = () => {
    fetch(`/api/meal/${id}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        typeMeal: meal,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Errore nel salvataggio del pasto");
        return res.json();
      })
      .then((data) => {
        if (refreshMacros) refreshMacros();
        navigate("/", {
          state: {
            toast: {
              type: "success",
              message: "Recipe completed!",
            },
          },
        });
      })
      .catch((err) => {
        console.error("Errore salvataggio:", err);
        alert("Si è verificato un errore nel salvataggio del pasto.");
      });
  };

  const toggleStep = (index) => {
    setOpenStep(openStep === index ? null : index);
  };

  if (!recipeData) return <div className="loading">Loading recipe...</div>;

  return (
    <div className="recipe-wrapper">
      <div ref={headerRef} className="fixed-header-block">
        <div className="firstLine">
          <BackButton />
        </div>
        <h1 className="page-title">Recipe</h1>
      </div>
      <div className="scrollable-content">
        <div className="recipe-page">
          <div className="recipe-image-box">
            <img src={recipeData.info.foto} alt={recipeData.info.name} />
          </div>

          <div className="recipe-info">
            <h3>{recipeData.info.name}</h3>
          </div>

          <div
            className="ingredients-box liquid-glass"
            onClick={() => setShowIngredients(!showIngredients)}
          >
            <div className="ingredients-header">
              <h3>Ingredients</h3>
              <span>{showIngredients ? "▲" : "▼"}</span>
            </div>
            {showIngredients && (
              <ul>
                {recipeData.ingredients.map((ing, i) => (
                  <li key={i}>
                    <span>{ing.name}</span>
                    <span className="grams">{ing.grams}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="recipe-steps">
            {recipeData.steps.map((step, index) => (
              <div
                key={index}
                className="recipe-step liquid-glass"
                onClick={() => toggleStep(index)}
              >
                <div className="step-header">
                  <span className="step-number">{step.step_number}</span>
                  <h4>{step.step_title}</h4>
                  <span className="tap-hint">
                    {openStep === index ? "▲" : "▼"}
                  </span>
                </div>
                {openStep === index && (
                  <p className="step-details">{step.step_details}</p>
                )}
              </div>
            ))}
          </div>

          <div className="complete-btn-container">
            <button className="custom-btn main-action" onClick={handleComplete}>
              COMPLETE!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Recipe;
