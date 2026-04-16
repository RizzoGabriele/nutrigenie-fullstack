import { useNavigate, useLocation } from "react-router-dom";
import "./Sel_Restaur.css";
import BackButton from "../components/BackButton";

export default function Sel_Restaur() {
  const navigate = useNavigate();
  const location = useLocation();

  const navState = location.state || {};
  const userLocation = navState.userLocation || null;
  const restaurantsFromState = navState.restaurants || [];
  const meal = navState.meal || null;
  const restaurantName = navState.restaurantName || null;

  const baseRestaurants =
    restaurantsFromState.length > 0
      ? restaurantsFromState
      : [];

  const calcDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  let restaurantsToShow = baseRestaurants;

  if (userLocation?.latitude && userLocation?.longitude) {
    restaurantsToShow = baseRestaurants
      .map((r) => ({
        ...r,
        distanceKm: calcDistance(
          userLocation.latitude,
          userLocation.longitude,
          r.latitude ?? r.lat,
          r.longitude ?? r.lng
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  const handleSelectRestaurant = (rest) => {
    navigate("/mealReady", {
      replace: true,
      state: {
        userLocation,
        restaurants: baseRestaurants,
        selectedRestaurant: rest,
        meal,
        mealId: meal?.id,
        restaurantName,
      },
    });
  };

  return (
    <div className="sel-rest-page">
      <div className="selrest-fixed-header">
        <h1 className="page-title">Select Restaurant</h1>
      </div>
      <div className="firstLine">
        <BackButton />
      </div>
      <div className="selrest-scrollable">
        <div className="selrest-list">
          {restaurantsToShow.map((rest, index) => (
            <div
              key={rest.id ?? `${rest.name}-${index}`}
              className="restaurant-card liquid-glass"
              onClick={() => handleSelectRestaurant(rest)}
            >
              <div className="rest-info-header">
                <h3 className="rest-name">{rest.name}</h3>

                {rest.distanceKm && (
                  <span className="rest-distance-badge">
                    {rest.distanceKm.toFixed(2)} km
                  </span>
                )}
              </div>

              <p className="rest-address">{rest.address}</p>

              {rest.distanceKm && (
                <p className="rest-distance">
                  📍 {rest.distanceKm.toFixed(2)} km away
                </p>
              )}

              <div className="rest-action-label">Tap to select</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
