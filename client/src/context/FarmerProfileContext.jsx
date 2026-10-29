import { createContext, useContext, useState, useEffect, useCallback } from "react";

const FarmerProfileContext = createContext();

const STORAGE_KEY = "agrisense_farmer_profile";

const DEFAULT_PROFILE = {
  landSizeAcres: 0,
  category: "general",
  previousCrop: "",
  priorityGroup: "none",
  state: "",
  district: "",
  exclusionFlags: {
    isIncomeTaxPayer: false,
    isGovtEmployee: false,
    isInstitutionalLand: false
  },
};

function calcCategory(acres) {
  const a = Number(acres) || 0;
  if (a < 2.5) return "marginal";
  if (a <= 5.0) return "small";
  return "general";
}

export function FarmerProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PROFILE, ...parsed, category: calcCategory(parsed.landSizeAcres) };
      }
    } catch (e) {
      console.warn("Failed to load farmer profile from localStorage:", e);
    }
    return DEFAULT_PROFILE;
  });

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn("Failed to save farmer profile:", e);
    }
  }, [profile]);

  const updateProfile = useCallback((patch) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      // Auto-recalculate category when landSizeAcres changes
      if (patch.landSizeAcres !== undefined) {
        next.category = calcCategory(patch.landSizeAcres);
      }
      return next;
    });
  }, []);

  const updateLocation = useCallback((state, district) => {
    setProfile((prev) => ({ ...prev, state: state || prev.state, district: district || prev.district }));
  }, []);

  return (
    <FarmerProfileContext.Provider value={{ profile, updateProfile, updateLocation }}>
      {children}
    </FarmerProfileContext.Provider>
  );
}

export function useFarmerProfile() {
  const ctx = useContext(FarmerProfileContext);
  if (!ctx) throw new Error("useFarmerProfile must be used within FarmerProfileProvider");
  return ctx;
}
