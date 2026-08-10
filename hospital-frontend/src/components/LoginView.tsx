import { useNavigate } from "react-router-dom";
import axios from "axios";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, User, Shield, Eye, EyeOff, Sparkles } from "lucide-react";
import { UserProfile } from "../types";
interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/auth/login/", {
        username,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("refreshToken", res.data.refresh);
      localStorage.setItem("role", res.data.role);

      onLoginSuccess({
        username: res.data.username,
        role: res.data.role,
      });
    } catch (error) {
      alert("Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border rounded-xl shadow-sm p-6"
      >
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-blue-800 w-12 h-12 mx-auto flex items-center justify-center rounded-xl text-white mb-3">
            <Shield />
          </div>
          <h1 className="text-2xl font-bold text-blue-900">
            Gestion de Stock
          </h1>
          <p className="text-sm text-gray-500">
            Accès sécurisé hospitalier
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Username */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Identifiant
            </label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 pl-10 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Votre identifiant"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Mot de passe
            </label>

            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="••••••••"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-blue-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-blue-800 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          {/* Forgot password */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs text-blue-700 hover:underline"
            >
              Mot de passe oublié ?
            </button>
          </div>

        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <Sparkles className="inline w-3 h-3 mr-1" />
          Système hospitalier sécurisé
        </div>

      </motion.div>
    </div>
  );
}