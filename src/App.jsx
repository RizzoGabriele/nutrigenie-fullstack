import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Layout from "./pages/Layout";
import ChooseMeal from "./pages/ChooseMeal";
import MealInfo from "./pages/MealInfo";
import MealReady from "./pages/MealReady";
import QrCode from "./pages/QrCode";
import Sel_Restaur from "./pages/Sel_Restaur";
import ChooseCalories from "./pages/ChooseCalories";
import SetNeeds from "./pages/SetNeeds";
import ViewMeal from "./pages/ViewMeal";
import History from "./pages/History";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Recipe from "./pages/Recipe";
import Confirm from "./pages/Confirm";

import { MacrosProvider } from "./pages/MacrosContext";
import "./App.css";

function App() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = async () => {
    try {
      const el = document.documentElement;

      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  return (
    <MacrosProvider>
      {!isFullscreen && (
        <button
          onClick={enterFullscreen}
          className="fullscreen-btn"
          aria-label="Fullscreen"
        >
          <i className="bi bi-arrows-fullscreen"></i>
        </button>
      )}

      <Routes>
        <Route element={<Layout />}>
          <Route path="/chooseCalories" element={<ChooseCalories />} />
          <Route path="/setNeeds" element={<SetNeeds />} />
          <Route path="/meal/:id" element={<ChooseMeal />} />
          <Route path="/meal/:id/mealInfo" element={<MealInfo />} />
          <Route path="/mealready" element={<MealReady />} />
          <Route path="/qrCode" element={<QrCode />} />
          <Route path="/sel_Restaur" element={<Sel_Restaur />} />
          <Route path="/viewMeal" element={<ViewMeal />} />
          <Route path="/history" element={<History />} />
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/editProfile" element={<EditProfile />} />
          <Route path="/meal/:id/recipe" element={<Recipe />} />
          <Route path="/:mealId/:typeMealId/confirm" element={<Confirm />} />
        </Route>
      </Routes>
    </MacrosProvider>
  );
}

export default App;
