import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

export const MacrosContext = createContext(null);

const initialMealDraft = {
  kcal: 0,
  carbsPct: 50,
  proteinsPct: 30,
  fatsPct: 20,
};

export function MacrosProvider({ children }) {
  const [macros, setMacros] = useState(null);
  const [meal, setMeal] = useState(null);
  const [mealDraft, setMealDraft] = useState(initialMealDraft);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshMacros = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/getCalories", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Errore nella fetch");

      const data = await res.json();
      setMacros(data);
    } catch (e) {
      console.error(e);
      setError(e?.message ?? "Errore");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMacros();
  }, [refreshMacros]);

  useEffect(() => {
    const left = macros?.caloriesLeft ?? 0;

    setMealDraft((prev) => {
      if (prev.kcal && prev.kcal > 0) return prev;
      return { ...prev, kcal: left };
    });
  }, [macros]);

  function resetMealDraft(nextKcal) {
    const kcal =
      typeof nextKcal === "number" ? nextKcal : macros?.caloriesLeft ?? 0;
    setMealDraft({ ...initialMealDraft, kcal });
  }

  function updateMealDraft(patch) {
    setMealDraft((prev) => ({ ...prev, ...patch }));
  }

  const value = useMemo(
    () => ({
      macros,
      setMacros,
      refreshMacros,
      meal,
      setMeal,
      mealDraft,
      setMealDraft,
      updateMealDraft,
      resetMealDraft,
      loading,
      error,
    }),
    [macros, meal, mealDraft, loading, error, refreshMacros]
  );

  return (
    <MacrosContext.Provider value={value}>{children}</MacrosContext.Provider>
  );
}

export function useMacros() {
  const ctx = useContext(MacrosContext);
  if (!ctx) throw new Error("useMacros must be used inside <MacrosProvider>");
  return ctx;
}
