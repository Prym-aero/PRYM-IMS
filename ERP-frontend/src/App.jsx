import { Routes, Route } from "react-router-dom";
import "./App.css";
import GenerateQRPage from "./pages/GenerateQRPage";


function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<GenerateQRPage />} />

      </Routes>
    </>
  );
}

export default App;
