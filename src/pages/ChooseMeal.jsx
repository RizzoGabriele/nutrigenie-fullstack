import { useState, useEffect } from "react";
import MealPropose from "../components/MealPropose";
import ChooseButtons from "../components/ChooseButtons";
import Popup from "../components/Popup";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";

export default function ChooseMeal() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const candidates = location.state?.candidates || [];

  const currentIndex = candidates.findIndex((c) => String(c.id) === String(id));
  const currentMealObj = currentIndex !== -1 ? candidates[currentIndex] : null;

  const [popup, setPopup] = useState({
    open: false,
    title: "",
    message: "",
  });

  const [userLocation, setUserLocation] = useState(null);

  const closePopup = () => {
    setPopup({ open: false, title: "", message: "" });
  };

  const showPopup = (title, message) => {
    setPopup({ open: true, title, message });
  };

  useEffect(() => {
      const scroller = document.getElementById("root");
      scroller?.classList.add("no-scroll");
      return () => scroller?.classList.remove("no-scroll");
    }, []);

  const handleReject = () => {
    if (currentIndex < candidates.length - 1) {
      const nextMeal = candidates[currentIndex + 1];
      navigate(`/meal/${nextMeal.id}`, {
        replace: true,
        state: { candidates },
      });
    } else {
      showPopup("End of proposal", "No more dishes available!");
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevMeal = candidates[currentIndex - 1];
      navigate(`/meal/${prevMeal.id}`, {
        replace: true,
        state: { candidates },
      });
    }
  };

  const handleAccept = () => {
    if (!currentMealObj) {
      showPopup("Error", "I can't load this dish. Refresh and try again");
      return;
    }

    const restaurantName =
      currentMealObj.ristorante || currentMealObj.restaurant_name || null;

    navigate(`/meal/${currentMealObj.id}/mealInfo`, {
      state: {
        meal: currentMealObj,
        userLocation, 
        restaurantName,
      },
    });
  };

  return (
    <>
      <div className="firstLine">
        <BackButton />
      </div>

      <MealPropose mealId={id} preloadedData={currentMealObj} />

      <ChooseButtons
        onReject={handleReject}
        onAccept={handleAccept}
        onBack={handlePrevious}
        disableBack={currentIndex === 0}
      />

      {popup.open && (
        <Popup
          title={popup.title}
          message={popup.message}
          onClose={closePopup}
        />
      )}
    </>
  );
}
