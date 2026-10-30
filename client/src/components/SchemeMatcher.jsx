import { useState, useEffect, useRef } from "react";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useFarmerProfile } from "../context/FarmerProfileContext.jsx";
import { apiFetch } from "../lib/api.js";

export default function SchemeMatcher() {
  const { profile, updateProfile } = useFarmerProfile();
  const hasAutoTriggered = useRef(false);

  const [matchData, setMatchData] = useState({
    landAcres: profile.landSizeAcres > 0 ? String(profile.landSizeAcres) : "",
    crop: profile.previousCrop || "",
    category: profile.category || "general",
    priorityGroup: profile.priorityGroup || "none",
    exclusionFlags: {
      isIncomeTaxPayer: Array.isArray(profile.exclusionFlags) ? profile.exclusionFlags.includes("income_tax_payer") : Boolean(profile.exclusionFlags?.isIncomeTaxPayer),
      isGovtEmployee: Array.isArray(profile.exclusionFlags) ? profile.exclusionFlags.includes("government_employee_class_1_2") : Boolean(profile.exclusionFlags?.isGovtEmployee),
      isInstitutionalLand: Array.isArray(profile.exclusionFlags) ? profile.exclusionFlags.includes("institutional_landholder") : Boolean(profile.exclusionFlags?.isInstitutionalLand),
    },
  });
  const [matchedResults, setMatchedResults] = useState(null);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState("");



  // Sync form changes back to FarmerProfileContext
  useEffect(() => {
    updateProfile({
      landSizeAcres: Number(matchData.landAcres) || 0,
      previousCrop: matchData.crop,
      priorityGroup: matchData.priorityGroup,
      exclusionFlags: matchData.exclusionFlags,
    });
  }, [matchData.landAcres, matchData.crop, matchData.priorityGroup, JSON.stringify(matchData.exclusionFlags)]);

  // Auto-recalculate category from profile when landAcres changes
  useEffect(() => {
    const acres = Number(matchData.landAcres) || 0;
    let cat = "general";
    if (acres > 0 && acres < 2.5) cat = "marginal";
    else if (acres >= 2.5 && acres <= 5.0) cat = "small";
    setMatchData((prev) => ({ ...prev, category: cat }));
  }, [matchData.landAcres]);

  const doMatch = async (data) => {
    setMatching(true);
    setError("");
    try {
      const res = await apiFetch("/api/schemes/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landSizeAcres: Number(data.landAcres),
          currentCrop: data.crop,
          priorityGroups: data.priorityGroup !== "none" ? [data.priorityGroup] : [],
          exclusionFlags: data.exclusionFlags,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setMatchedResults(result);
      } else {
        setError("Failed to fetch matches. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while matching schemes.");
    } finally {
      setMatching(false);
    }
  };

  // Auto-trigger on mount if profile has enough data
  useEffect(() => {
    if (!hasAutoTriggered.current && profile.landSizeAcres > 0) {
      hasAutoTriggered.current = true;
      doMatch({
        landAcres: String(profile.landSizeAcres),
        crop: profile.previousCrop || "",
        category: profile.category || "general",
        priorityGroup: profile.priorityGroup || "none",
        exclusionFlags: {
          isIncomeTaxPayer: Array.isArray(profile.exclusionFlags) ? profile.exclusionFlags.includes("income_tax_payer") : Boolean(profile.exclusionFlags?.isIncomeTaxPayer),
          isGovtEmployee: Array.isArray(profile.exclusionFlags) ? profile.exclusionFlags.includes("government_employee_class_1_2") : Boolean(profile.exclusionFlags?.isGovtEmployee),
          isInstitutionalLand: Array.isArray(profile.exclusionFlags) ? profile.exclusionFlags.includes("institutional_landholder") : Boolean(profile.exclusionFlags?.isInstitutionalLand),
        },
      });
    }
  }, []);

  const handleMatchSubmit = async (e) => {
    e.preventDefault();
    doMatch(matchData);
  };

  const handleExclusionToggle = (key) => {
    setMatchData((prev) => ({
      ...prev,
      exclusionFlags: {
        ...prev.exclusionFlags,
        [key]: !prev.exclusionFlags[key],
      },
    }));
  };

  return (
    <div className="w-full">
      <div className="glass p-6 rounded-3xl mb-8 border border-primary/20">
        <h3 className="text-xl font-bold text-foreground mb-4">Eligibility Matcher</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Fill in your details to find government schemes you are eligible for.
          {profile.landSizeAcres > 0 && (
            <span className="block text-primary font-semibold mt-1">
              ✅ Profile loaded — {profile.category.toUpperCase()} farmer, {profile.landSizeAcres} acres
              {profile.district ? `, ${profile.district}` : ""}
            </span>
          )}
        </p>

        <form onSubmit={handleMatchSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Landholding Size (Acres)</label>
              <input
                type="number"
                step="0.01"
                required
                value={matchData.landAcres}
                onChange={(e) => setMatchData({ ...matchData, landAcres: e.target.value })}
                className="w-full rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. 2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Primary Crop</label>
              <select
                value={matchData.crop}
                onChange={(e) => setMatchData({ ...matchData, crop: e.target.value })}
                className="w-full rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select a crop...</option>
                <option value="rice">Rice</option>
                <option value="wheat">Wheat</option>
                <option value="maize">Maize</option>
                <option value="cotton">Cotton</option>
                <option value="sugarcane">Sugarcane</option>
                <option value="chickpea">Chickpea</option>
                <option value="mango">Mango</option>
                <option value="banana">Banana</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Land Category</label>
              <select
                value={matchData.category}
                onChange={(e) => setMatchData({ ...matchData, category: e.target.value })}
                className="w-full rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="marginal">Marginal Farmer (Up to 1 hectare)</option>
                <option value="small">Small Farmer (1 to 2 hectares)</option>
                <option value="general">General Farmer (More than 2 hectares)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Priority Group</label>
              <select
                value={matchData.priorityGroup}
                onChange={(e) => setMatchData({ ...matchData, priorityGroup: e.target.value })}
                className="w-full rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="none">None</option>
                <option value="sc_st">SC / ST</option>
                <option value="women">Women Farmer</option>
                <option value="north_east">North-Eastern State</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-3">Exclusions Checklist (Check if applicable)</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group" onClick={() => handleExclusionToggle('isIncomeTaxPayer')}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${matchData.exclusionFlags.isIncomeTaxPayer ? 'bg-primary border-primary text-white' : 'border-primary/30 bg-white group-hover:border-primary/50'}`}>
                    {matchData.exclusionFlags.isIncomeTaxPayer && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm text-foreground/80">Income Tax Payee</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group" onClick={() => handleExclusionToggle('isGovtEmployee')}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${matchData.exclusionFlags.isGovtEmployee ? 'bg-primary border-primary text-white' : 'border-primary/30 bg-white group-hover:border-primary/50'}`}>
                    {matchData.exclusionFlags.isGovtEmployee && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm text-foreground/80">Govt Employee (Class 1/2)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group" onClick={() => handleExclusionToggle('isInstitutionalLand')}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${matchData.exclusionFlags.isInstitutionalLand ? 'bg-primary border-primary text-white' : 'border-primary/30 bg-white group-hover:border-primary/50'}`}>
                    {matchData.exclusionFlags.isInstitutionalLand && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm text-foreground/80">Institutional Land</span>
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={matching}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl btn-gradient text-white text-sm font-bold transition disabled:opacity-70"
              >
                {matching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Match Schemes"}
              </button>
            </div>
            
            {error && <p className="text-red-500 text-xs text-center mt-2">{error}</p>}
          </div>
        </form>
      </div>

      {matchedResults && (
        <div className="space-y-4">
          <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Found {matchedResults.totalMatched} Eligible Schemes
          </h4>
          
          {matchedResults.matchedSchemes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchedResults.matchedSchemes.map((scheme) => (
                <div key={scheme.scheme_id} className="glass p-5 rounded-3xl border border-primary/20 flex flex-col justify-between h-full hover:shadow-lg transition">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-primary/10 text-primary-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {scheme.short_code}
                      </span>
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wide">
                        {scheme.benefit_type.replace('_', ' ')}
                      </span>
                    </div>
                    <h5 className="font-bold text-base text-foreground mb-2">{scheme.scheme_name}</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      {scheme.key_benefit_description}
                    </p>
                    
                    <div className="mb-4">
                      <h6 className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Required Documents:</h6>
                      <ul className="text-xs text-foreground/80 list-disc pl-4 space-y-1">
                        {scheme.required_documents.map((doc, idx) => (
                          <li key={idx}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <a
                    href={scheme.official_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary-dark rounded-xl text-xs font-bold transition mt-auto"
                  >
                    Visit Official Portal <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass p-8 text-center rounded-3xl text-muted-foreground text-sm border border-primary/20">
              No matching schemes found based on your profile. Try adjusting your exclusions or criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
