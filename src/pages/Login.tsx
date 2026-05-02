import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

export default function Login() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await login(user, password);

      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.role);
      localStorage.setItem("userId", res.id);
      localStorage.setItem("username", res.user); 
      
      if (res.role === "profesor") {
        navigate("/profesor");
      } else {
        navigate("/alumno");
      }

    } catch (err) {
      setError("Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200">

      {/* CARD */}
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">

        {/* TITLE */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Circuitos Eléctricos
          </h1>
          <p className="text-gray-500 text-sm">
            Accede a tu cuenta
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin}>

          {/* USER */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Introduce tu usuario"
            />
          </div>

          {/* PASSWORD */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-100 p-2 rounded">
              {error}
            </div>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

        </form>
      </div>

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center gap-3">
            
            {/* SPINNER */}
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

            <p className="text-gray-600 text-sm">
              Iniciando sesión...
            </p>

          </div>
        </div>
      )}

    </div>
  );
}