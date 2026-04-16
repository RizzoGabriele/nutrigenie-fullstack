import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import "./MealReady.css";
import { useMacros } from "../pages/MacrosContext";
import UserAddress from "../components/UserAddress";

const DEFAULT_RESTAURANT = {
  id: 1,
  name: "McDonald’s Torino Centro",
  address: "Via Nizza, 2/A, 10125 Torino TO",
  latitude: 45.06243692450461,
  longitude: 7.678642291144034,
  price_range: 1,
  rating: 4.5,
};

export default function MealReady() {
  const navigate = useNavigate();
  const location = useLocation();

  const { meal: typeMealId } = useMacros();

  const navState = location.state || {};
  const selectedMeal = navState.meal || null;

  // location iniziale (arriva dalla pagina precedente, se c'è)
  const userLocation = navState.userLocation || null;

  const restaurantName = navState.restaurantName || null;
  const selectedRestaurantFromState = navState.selectedRestaurant || null;
  const mealId = navState.mealId ?? selectedMeal?.id;

  const [restaurants, setRestaurants] = useState(navState.restaurants || []);
  const [selectedRestaurant, setSelectedRestaurant] = useState(
    selectedRestaurantFromState,
  );
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ questa è la location “vera” che arriva/si aggiorna da UserAddress
  const [currentUserLocation, setCurrentUserLocation] = useState(
    userLocation || null,
  );

  useEffect(() => {
    const scroller = document.getElementById("root");
    scroller?.classList.add("no-scroll");
    return () => scroller?.classList.remove("no-scroll");
  }, []);

  function calcDistance(lat1, lon1, lat2, lon2) {
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
  }

  const getRestaurantLatLng = (rest) => {
    const lat = parseFloat(rest.latitude ?? rest.lat);
    const lng = parseFloat(rest.longitude ?? rest.lng);
    return { lat, lng };
  };

  const getPriceSymbols = (rest) => {
    const value = Number(rest?.price_range ?? 0);
    if (!value || value < 1) return "€";
    if (value > 3) return "€€€";
    return "€".repeat(value);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchRestaurant = async () => {
      if (!restaurantName) {
        setRestaurants([DEFAULT_RESTAURANT]);
        setSelectedRestaurant(
          selectedRestaurantFromState || DEFAULT_RESTAURANT,
        );
        setError("Restaurant name not available, using default restaurant");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/restaurant/${encodeURIComponent(restaurantName)}`,
        );
        if (!res.ok) throw new Error("Error while fetching restaurant");

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        if (!cancelled) {
          if (list.length === 0) {
            setRestaurants([]);
            setSelectedRestaurant(null);
            setError("No restaurant found with this name");
          } else {
            setRestaurants(list);

            if (selectedRestaurantFromState) {
              const same =
                list.find((r) => r.id === selectedRestaurantFromState.id) ||
                selectedRestaurantFromState;
              setSelectedRestaurant(same);
            } else {
              setSelectedRestaurant(list[0]);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Unable to load restaurant info, using default");
          setRestaurants([DEFAULT_RESTAURANT]);
          setSelectedRestaurant(
            selectedRestaurantFromState || DEFAULT_RESTAURANT,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (restaurants.length > 0 && !restaurantName) {
      setLoading(false);
      setSelectedRestaurant(selectedRestaurantFromState || restaurants[0]);
    } else {
      fetchRestaurant();
    }

    return () => {
      cancelled = true;
    };
  }, [restaurantName]);

  // ✅ distanza calcolata SEMPRE con currentUserLocation (quella di UserAddress)
  useEffect(() => {
    if (!selectedRestaurant) {
      setDistance(null);
      return;
    }

    const computeDistance = (userLat, userLng) => {
      const { lat: restLat, lng: restLng } =
        getRestaurantLatLng(selectedRestaurant);

      if (Number.isNaN(restLat) || Number.isNaN(restLng)) {
        setDistance(null);
        return;
      }

      const dist = calcDistance(userLat, userLng, restLat, restLng);
      setDistance(dist.toFixed(2));
    };

    // ✅ NOTA: non usare check truthy, usa != null
    if (
      currentUserLocation?.latitude != null &&
      currentUserLocation?.longitude != null
    ) {
      computeDistance(
        parseFloat(currentUserLocation.latitude),
        parseFloat(currentUserLocation.longitude),
      );
    } else {
      // se userAddress non ha coords, non forzare geoloc qui: distanza sconosciuta
      setDistance(null);
    }
  }, [selectedRestaurant, currentUserLocation]);

  const handleBackToMealInfo = () => {
    navigate(`/meal/${selectedMeal.id}/mealinfo`, {
      replace: true,
      state: {
        meal: selectedMeal,
        userLocation: currentUserLocation, // ✅ passa quella aggiornata
      },
    });
  };

  const handleChangeRestaurant = () => {
    navigate("/Sel_Restaur", {
      state: {
        userLocation: currentUserLocation, // ✅ passa quella aggiornata
        restaurants,
        meal: selectedMeal,
        restaurantName,
      },
    });
  };

  const handleGetQrCode = () => {
    const { lat, lng } = getRestaurantLatLng(selectedRestaurant);

    navigate("/QrCode", {
      state: {
        lat,
        lng,
        name: selectedRestaurant.name,
        mealId: selectedMeal.id,
        typeMealId: typeMealId,
        userLocation: currentUserLocation, // ✅ opzionale ma utile
      },
    });
  };

  return (
    <>
      <div className="firstLine">
        <BackButton onClick={handleBackToMealInfo} />

        {/* ✅ qui ricevi loc (address + lat/lon) da UserAddress */}
        <UserAddress
          onLocationChange={(loc) => {
            setCurrentUserLocation(loc);
          }}
        />
      </div>

      <div className="mr-wrap">
        <div className="mr-hero">
          <div className="mr-emoji" aria-hidden="true">
            👌
          </div>
          <h1 className="mr-title">Perfect Match!</h1>
          <p className="mr-subtitle">
            We found the best spot for your meal but you can edit it
          </p>
        </div>

        {loading && <p className="mr-status">Loading restaurant info...</p>}
        {error && <p className="mr-status mr-error">{error}</p>}

        {!loading && selectedRestaurant && (
          <div className="mr-card liquid-glass">
            <div className="mr-card-header">
              <div className="mr-card-main">
                <h2 className="mr-rest-name">{selectedRestaurant.name}</h2>
                <p className="mr-rest-address">
                  📍 {selectedRestaurant.address}
                  {selectedRestaurant.city
                    ? `, ${selectedRestaurant.city}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="mr-stats mr-stats-row">
              <div className="mr-stat">
                <div className="mr-stat-label">DISTANCE</div>
                <div className="mr-stat-value">
                  {distance ? `${distance} km` : "—"}
                </div>
              </div>

              <div className="mr-stat">
                <div className="mr-stat-label">PRICE</div>
                <div className="mr-stat-value">
                  {getPriceSymbols(selectedRestaurant)}
                </div>
              </div>
            </div>

            <div className="mr-actions mr-actions-col">
              <button
                className="mr-btn mr-btn-secondary"
                onClick={handleChangeRestaurant}
                disabled={restaurants.length === 0}
              >
                Change
              </button>
              <button
                className="mr-btn mr-btn-primary"
                onClick={handleGetQrCode}
              >
                Get QR
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
