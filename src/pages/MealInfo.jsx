import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BackButton from "../components/BackButton";
import "./MealInfo.css";
import UserAddress from "../components/UserAddress";

export default function MealInfo() {
  const navigate = useNavigate();
  const location = useLocation();

  const meal = location.state?.meal;
  const userLocation = location.state?.userLocation || null;
  const restaurantNameFromState = location.state?.restaurantName || null;
  const restaurantName =
    restaurantNameFromState ||
    meal?.ristorante ||
    meal?.restaurant_name ||
    meal?.restaurantName ||
    null;

  const [allergens, setAllergens] = useState([]);
  const [allergensLoading, setAllergensLoading] = useState(false);
  const [allergensErr, setAllergensErr] = useState("");

  const headerRef = useRef(null);

  useEffect(() => {
    if (!meal) navigate("/");
  }, [meal, navigate]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const setVar = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        "--mealinfo-header-height",
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

  useEffect(() => {
    if (!meal?.id) return;

    let cancelled = false;
    setAllergensLoading(true);
    setAllergensErr("");

    fetch(`/api/meals/${meal.id}/allergens/names`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : [];
        const unique = Array.from(
          new Map(arr.map((item) => [item.id, item])).values(),
        );
        setAllergens(unique);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error("Fetch allergens error:", e);
        setAllergensErr("No allergen information available.");
        setAllergens([]);
      })
      .finally(() => {
        if (cancelled) return;
        setAllergensLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [meal?.id]);

  if (!meal) return null;

  const handleOrder = () => {
    navigate("/mealReady", {
      state: {
        meal,
        userLocation,
        restaurantName,
      },
    });
  };

  const handlePrepareSimilar = () => {
    navigate(`/meal/${meal.id}/recipe`, {
      state: { meal },
    });
  };

  return (
    <div className="meal-info-wrapper">
      <div ref={headerRef} className="fixed-header">
        <div className="firstLine">
          <BackButton />
        </div>
      </div>

      <div className="info-scroll-container">
        <div className="mealinfo-card-host">
          <div className="info-card">
            <h2 className="food-title mealinfo-title-inside-card">
              {meal.dish_name_en || meal.name}
            </h2>

            <div className="food-image-container">
              <img
                src={meal.image_url || meal.foto || "/placeholder-food.png"}
                alt={meal.dish_name_en || meal.name}
                className="food-image"
              />
            </div>

            <div className="information">
              <button
                className="btn w-100 text-start d-flex justify-content-between align-items-center mb-2"
                data-bs-toggle="collapse"
                data-bs-target="#nutritional"
              >
                Nutritional Summary
                <span>▼</span>
              </button>

              <div id="nutritional" className="collapse border p-3 mb-3">
                <p className="d-flex justify-content-between border-bottom pb-1 mb-2">
                  <strong>Calories:</strong>
                  <span className="remove_bg">
                    {meal.kcal || meal.calorie} kcal
                  </span>
                </p>
                <p className="d-flex justify-content-between border-bottom pb-1 mb-2">
                  <strong>Carbs:</strong>
                  <span className="remove_bg">
                    {meal.carbs || meal.carbo || meal.carbs_g || 0} g
                  </span>
                </p>
                <p className="d-flex justify-content-between border-bottom pb-1 mb-2">
                  <strong>Proteins:</strong>
                  <span className="remove_bg">
                    {meal.protein || meal.proteins || meal.protein_g || 0} g
                  </span>
                </p>
                <p className="d-flex justify-content-between pb-1">
                  <strong>Fats:</strong>
                  <span className="remove_bg">
                    {meal.fat || meal.fat_g || 0} g
                  </span>
                </p>
              </div>

              <button
                className="btn w-100 text-start d-flex justify-content-between align-items-center mb-2"
                data-bs-toggle="collapse"
                data-bs-target="#allergens"
              >
                Allergens Information
                <span>▼</span>
              </button>

              <div id="allergens" className="collapse border p-3 mb-3">
                {allergensLoading ? (
                  <span>Loading allergen information...</span>
                ) : allergensErr ? (
                  <span>{allergensErr}</span>
                ) : allergens.length === 0 ? (
                  <span>No allergen information available.</span>
                ) : (
                  <div className="tag-container">
                    {allergens.map((a) => (
                      <span key={a.id ?? a.name} className="tag">
                        {a.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="btn w-100 text-start d-flex justify-content-between align-items-center mb-2"
                data-bs-toggle="collapse"
                data-bs-target="#related"
              >
                Restaurant Information
                <span>▼</span>
              </button>

              <div id="related" className="collapse border p-3">
                <p>
                  <strong>Name:</strong>{" "}
                  {restaurantName || "Restaurant info not available"}
                </p>
              </div>
            </div>

            <div className="action-buttons">
              <button className="custom-btn" onClick={handleOrder}>
                Order
              </button>
              <button className="custom-btn" onClick={handlePrepareSimilar}>
                Prepare similar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
