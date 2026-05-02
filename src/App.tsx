import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ProfesorDashboard from "./pages/ProfesorDashboard";
import AlumnoDashboard from "./pages/AlumnoDashboard";
import Editor from "./pages/Editor";
import ViewCircuit from "./pages/ViewCircuit";
import ResolveCircuit from "./pages/ResolveCircuit";
import ReviewCircuit from "./pages/ReviewCircuit";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/profesor" element={<ProfesorDashboard />} />
      <Route path="/alumno" element={<AlumnoDashboard />} />
      <Route path="/editor" element={<Editor />} />
      <Route path="/circuit/:id" element={<ViewCircuit />} />
      <Route path="/resolver/:id" element={<ResolveCircuit />} />
       <Route path="/review/:id" element={<ReviewCircuit />} />
    </Routes>
  );
}