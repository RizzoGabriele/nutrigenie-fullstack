import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./History.css";

export default function History() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const headerRef = useRef(null);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch history");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const setVar = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        "--history-header-height",
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

  return (
    <div className="history-page-container">
      <div ref={headerRef} className="fixed-header-block">
        <h1 className="page-title">History</h1>
      </div>

      <div className="scrollable-content">
        {loading && <p className="state-text">Loading…</p>}
        {error && <p className="state-text error">{error}</p>}

        {!loading && !error && (
          <div className="history-list">
            {data.map((section) => (
              <div key={section.date} className="history-section">
                <p className="history-date">{formatDate(section.date)}</p>

                {section.items.map((item) => (
                  <Link
                    key={item.id}
                    className="history-card history-card-link"
                    to="/ViewMeal"
                    state={{ item: item, date: section.date }}
                  >
                    <div className="history-card-left">
                      <img
                        src={item.image_url || "/placeholder-food.png"}
                        alt={item.dish_name_en}
                        className="history-card-img"
                        loading="lazy"
                      />

                      <div className="history-card-text">
                        <p className="dish-name">{item.dish_name_en}</p>
                        <p className="dish-kcal">{item.kcal} kcal</p>

                        <span
                          className={`badge tag-category ${mealTagClass(
                            item.typeMeal,
                          )}`}
                        >
                          {mealTypeLabel(item.typeMeal)}
                        </span>
                      </div>
                    </div>

                    <span className="arrow" aria-hidden="true">
                      ›
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
  });
}

function mealTypeLabel(typeMeal) {
  const t = Number(typeMeal);
  if (t === 1) return "Breakfast";
  if (t === 2) return "Lunch";
  if (t === 3) return "Dinner";
  return "Meal";
}

function mealTagClass(typeMeal) {
  const t = Number(typeMeal);
  if (t === 1) return "tag-breakfast";
  if (t === 2) return "tag-lunch";
  if (t === 3) return "tag-dinner";
  return "tag-default";
}
