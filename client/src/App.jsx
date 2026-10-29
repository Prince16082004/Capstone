import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { FarmerProfileProvider } from "./context/FarmerProfileContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CropRecommend from "./pages/CropRecommend.jsx";
import WeatherPage from "./pages/WeatherPage.jsx";
import DiseaseDetect from "./pages/DiseaseDetect.jsx";
import IrrigationPage from "./pages/IrrigationPage.jsx";
import FertilizerPage from "./pages/FertilizerPage.jsx";
import MarketPage from "./pages/MarketPage.jsx";
import GovernmentSchemes from "./pages/GovernmentSchemes.jsx";
import SoilAnalyzer from "./pages/SoilAnalyzer.jsx";

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <FarmerProfileProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/crop-recommendation" element={<ProtectedRoute><CropRecommend /></ProtectedRoute>} />
            <Route path="/weather" element={<ProtectedRoute><WeatherPage /></ProtectedRoute>} />
            <Route path="/disease-detection" element={<ProtectedRoute><DiseaseDetect /></ProtectedRoute>} />
            <Route path="/irrigation" element={<ProtectedRoute><IrrigationPage /></ProtectedRoute>} />
            <Route path="/fertilizer" element={<ProtectedRoute><FertilizerPage /></ProtectedRoute>} />
            <Route path="/market-prices" element={<ProtectedRoute><MarketPage /></ProtectedRoute>} />
            <Route path="/government-schemes" element={<ProtectedRoute><GovernmentSchemes /></ProtectedRoute>} />
            <Route path="/soil-analyzer" element={<ProtectedRoute><SoilAnalyzer /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
        </FarmerProfileProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
