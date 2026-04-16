import { useEffect, useState } from "react";
import "./MealPropose.css";

export default function MealPropose({ mealId, preloadedData }) {
  const [meal, setMeal] = useState(preloadedData || null);
  const [loading, setLoading] = useState(!preloadedData);
  const [error, setError] = useState("");

  useEffect(() => {
    if (preloadedData) {
      setMeal(preloadedData);
      setLoading(false);
      setError("");
      return; 
    }

    const fetchMeal = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/meals/${mealId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch meal");
        }

        const data = await res.json();
        setMeal(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load meal data");
      } finally {
        setLoading(false);
      }
    };

    fetchMeal();

  }, [mealId, preloadedData]); 

  if (loading) {
    return <div className="food-card">Loading...</div>;
  }

  if (error || !meal) {
    return <div className="food-card">{error || "Meal not found"}</div>;
  }

  return (
    <div className="food-card">
      <h2 className="meal-info-title">{meal.name}</h2>

      <div className="food-tags">
        <span className="badge tag-category">{meal.category}</span>
        <span className="badge tag-restaurant">{meal.ristorante}</span>
      </div>

      <div className="food-image-container">
        <img src={meal.foto} alt={meal.name} className="food-image" />
      </div>

      <div className="food-kcal">{meal.calorie} Kcal</div>

      <div className="food-info">
        <p>
          <span>Carbs</span> {meal.carbo} g
        </p>
        <p>
          <span>Proteins</span> {meal.proteins} g
        </p>
        <p>
          <span>Fats</span> {meal.fat} g
        </p>
      </div>
    </div>
  );
}
