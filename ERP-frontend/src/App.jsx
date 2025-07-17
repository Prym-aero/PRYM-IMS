import { Routes, Route } from "react-router-dom";
import "./App.css";
import GenerateQRPage from "./pages/GenerateQRPage";
import LoginPage from "./pages/Login";
import SinglePartPage from "./pages/SinglePartPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<GenerateQRPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/part/:id" element={<SinglePartPage />} />
      </Routes>
    </>
  );
}

export default App;
