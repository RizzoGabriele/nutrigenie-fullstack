import { useState, useEffect, useRef } from "react";
import "./UserAddress.css";
import BackButton from "./BackButton";

const currentUserEmail = "sara.rossi@gmail.com";

const formatAddress = (sugg) => {
  if (!sugg?.address) return sugg.display_name;

  const { road, house_number, city, town, village } = sugg.address;
  const cityName = city || town || village || "";
  return [road, house_number, cityName].filter(Boolean).join(", ");
};

export default function UserAddress({ onLocationChange }) {
  const [address, setAddress] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [coords, setCoords] = useState({ latitude: null, longitude: null });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const initializedRef = useRef(false);
  const locationChangeRef = useRef(onLocationChange);

  useEffect(() => {
    locationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  const debounceRef = useRef(null);

  // ✅ Geocoding: address (string) -> { latitude, longitude }
  const geocodeAddress = async (addr) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addr,
        )}&limit=1`,
      );
      if (!res.ok) return null;

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;

      const latitude = parseFloat(data[0].lat);
      const longitude = parseFloat(data[0].lon);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
      return { latitude, longitude };
    } catch (e) {
      console.warn("Geocode failed:", e);
      return null;
    }
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      // 1) DB (indirizzo salvato utente) + geocoding per lat/lon
      try {
        const res = await fetch(`/api/user/${currentUserEmail}`);
        if (res.ok) {
          const user = await res.json();
          if (user?.address && user.address.trim()) {
            const addr = user.address.trim();

            // ✅ prova a riusare cache se coincide
            try {
              const saved = localStorage.getItem("userLocation");
              if (saved) {
                const parsed = JSON.parse(saved);
                if (
                  parsed?.address &&
                  parsed.address.trim() === addr &&
                  parsed.latitude != null &&
                  parsed.longitude != null
                ) {
                  const locCached = {
                    address: parsed.address,
                    latitude: parsed.latitude,
                    longitude: parsed.longitude,
                    source: "db-cache",
                  };

                  setAddress(locCached.address);
                  setCoords({
                    latitude: locCached.latitude,
                    longitude: locCached.longitude,
                  });
                  setLoading(false);
                  setError("");
                  locationChangeRef.current?.(locCached);
                  return;
                }
              }
            } catch {
              // ignore cache parse errors
            }

            // ✅ geocode del testo preso dal DB
            const geo = await geocodeAddress(addr);

            const loc = {
              address: addr,
              latitude: geo?.latitude ?? null,
              longitude: geo?.longitude ?? null,
              source: "db",
            };

            setAddress(loc.address);
            setCoords({ latitude: loc.latitude, longitude: loc.longitude });
            setLoading(false);
            setError("");
            locationChangeRef.current?.(loc);

            // cache utile per non rigeocodare
            localStorage.setItem("userLocation", JSON.stringify(loc));
            return;
          }
        }
      } catch (e) {
        console.warn("DB address fetch failed, fallback...", e);
      }

      // 2) localStorage fallback
      try {
        const saved = localStorage.getItem("userLocation");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.address) {
            setAddress(parsed.address);
            setCoords({
              latitude: parsed.latitude ?? null,
              longitude: parsed.longitude ?? null,
            });
            setLoading(false);
            setError("");
            locationChangeRef.current?.({ ...parsed, source: "localStorage" });
            return;
          }
        }
      } catch (e) {
        console.error("Error reading saved location", e);
      }

      // 3) geolocalizzazione fallback
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser");
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            );

            if (!response.ok)
              throw new Error("Error while retrieving the address");

            const data = await response.json();

            const fullAddress =
              (data.address?.road || "") +
              " " +
              (data.address?.house_number || "") +
              ", " +
              (data.address?.city ||
                data.address?.town ||
                data.address?.village ||
                "");

            const finalAddress = fullAddress || "Address not available";

            setAddress(finalAddress);
            setCoords({ latitude, longitude });
            setLoading(false);
            setError("");

            const loc = {
              address: finalAddress,
              latitude,
              longitude,
              source: "geo",
            };
            locationChangeRef.current?.(loc);
            localStorage.setItem("userLocation", JSON.stringify(loc));
          } catch (err) {
            console.error(err);
            setError("Unable to retrieve the address");
            setLoading(false);
          }
        },
        () => {
          setError("Unable to get your location");
          setLoading(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000,
        },
      );
    };

    init();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setManualAddress(value);

    if (!value.trim() || value.trim().length < 3) {
      setSuggestions([]);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value.trim());
    }, 500);
  };

  const fetchSuggestions = async (query) => {
    try {
      setIsSearching(true);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&addressdetails=1&limit=5`,
      );

      if (!res.ok) {
        if (res.status === 429 || res.status === 503) {
          console.warn("Nominatim rate limited or unavailable:", res.status);
          setSuggestions([]);
          return;
        }
        throw new Error("Error searching address");
      }

      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Autocomplete error:", err);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = async (sugg) => {
    const chosenAddress = formatAddress(sugg);

    const latitude = parseFloat(sugg.lat);
    const longitude = parseFloat(sugg.lon);

    setAddress(chosenAddress);
    setManualAddress("");
    setSuggestions([]);
    setError("");
    setCoords({ latitude, longitude });

    const loc = {
      address: chosenAddress,
      latitude,
      longitude,
      source: "manual",
    };
    locationChangeRef.current?.(loc);
    localStorage.setItem("userLocation", JSON.stringify(loc));
    setOpen(false);
  };

  return (
    <div className="firstLine">
      <BackButton />

      <div className={`dropdown userAddress ${open ? "show" : ""}`}>
        <button
          type="button"
          className="btn dropdown-toggle d-inline-flex align-items-center justify-content-center gap-2"
          aria-expanded={open}
          data-bs-auto-close="outside"
          onClick={() => setOpen((v) => !v)}
        >
          <i className="bi bi-geo-alt"></i>

          {loading && (
            <>
              <span className="spinner-border spinner-border-sm" />
              <span>Detecting your location...</span>
            </>
          )}

          {error && <span>Unable to get your location.</span>}

          {!loading && !error && address && <span>{address}</span>}
          {!loading && !error && !address && <span>Set your address</span>}
        </button>

        <div
          className={`dropdown-menu p-4 text-center liquid-glass ${
            open ? "show" : ""
          }`}
        >
          <div className="mb-3">
            <label
              htmlFor="exampleOfAddress"
              className="form-label addressLabel"
            >
              Enter your address
            </label>
            <input
              type="text"
              className="form-control text-center"
              id="exampleOfAddress"
              placeholder={address || "Type your address"}
              value={manualAddress}
              onChange={handleInputChange}
            />
          </div>

          {manualAddress && suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((s, idx) => (
                <li key={idx} onClick={() => handleSuggestionClick(s)}>
                  {formatAddress(s)}
                </li>
              ))}
            </ul>
          )}

          {manualAddress && isSearching && suggestions.length === 0 && (
            <p style={{ fontSize: 12, marginTop: 8 }}>Searching…</p>
          )}
        </div>
      </div>
    </div>
  );
}
