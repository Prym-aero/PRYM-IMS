import { Routes, Route } from "react-router-dom";
import "./App.css";
import GenerateQRPage from "./pages/GenerateQRPage";
import LoginPage from "./pages/Login";
import SinglePartPage from "./pages/SinglePartPage";
import SingleProductPage from "./pages/SingleProductPage";
import RecentActivitiesPage from "./pages/RecentActivitiesPage";
import ScanningActivitiesPage from "./pages/ScanningActivitiesPage";
import SingleScanningActivityPage from "./pages/SingleScanningActivityPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<GenerateQRPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/part/:id" element={<SinglePartPage />} />
        <Route path="/product/:id" element={<SingleProductPage />} />
        <Route path="/activities" element={<RecentActivitiesPage />} />
        <Route path="/scanning-activities" element={<ScanningActivitiesPage />} />
        <Route path="/scanning-activities/:id" element={<SingleScanningActivityPage />} />
      </Routes>
    </>
  );
}

export default App;
