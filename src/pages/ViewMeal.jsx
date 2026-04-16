import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import "./ViewMeal.css";

export default function ViewMeal() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const meal = state?.item;

  function invertDate(dateStr) {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  }
  
  const date = invertDate(state?.date);

  useEffect(() => {
    if (!meal) {
      navigate("/history");
    }
  }, [meal, navigate]);

  if (!meal) return null;

  return (
    <>
      <div className="firstLine">
        <BackButton />
      </div>

      <div className="food-card">
        <h2 className="meal-info-title">{meal.dish_name_en}</h2>

        <div className="food-tags">
          <span className="badge tag-date">{date}</span>
          {meal.category && <span className="badge tag-category">{meal.category}</span>}
        </div>

        <div className="food-image-container">
          <img 
            src={meal.image_url || "/placeholder-food.png"} 
            alt={meal.dish_name_en} 
            className="food-image" 
          />
        </div>

        <div className="food-kcal">{meal.kcal} Kcal</div>

        <div className="food-info">
          <p>
            <span>Carbs</span> {meal.carbs_g || 0} g
          </p>
          <p>
            <span>Proteins</span> {meal.protein_g || 0} g
          </p>
          <p>
            <span>Fats</span> {meal.fat_g || 0} g
          </p>
        </div>
      </div>
    </>
  );
}