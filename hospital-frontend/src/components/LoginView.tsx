import { useNavigate } from "react-router-dom";
import axios from "axios";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, User, Shield, Eye, EyeOff, Package, Activity, Bell, BarChart3, Sparkles } from "lucide-react";
import { UserProfile } from "../types";
interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/auth/login/", {
        username,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("refreshToken", res.data.refresh);
      localStorage.setItem("role", res.data.role);

      onLoginSuccess({
        name: res.data.username,
        roleName: res.data.role,
        role: res.data.role,
        email: res.data.email || "",
        phone: "",
        employeeId: "",
        avatar: "",
      });
    } catch (error) {
      setLoginError("Identifiant ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

    {/* Arrière-plan 50 / 50 */}
    <div className="absolute inset-0 hidden lg:grid lg:grid-cols-2">
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950" />
      <div className="bg-slate-50 dark:bg-slate-950" />
    </div>

    {/* Contenu */}
    <main className="relative z-10 flex h-full items-center justify-center px-4">

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="
          grid w-full max-w-4xl
          grid-cols-1
          overflow-hidden
          rounded-xl
          border border-slate-200
          bg-white
          shadow-2xl
          dark:border-slate-800
          dark:bg-slate-900
          lg:grid-cols-2
        "
      >

        {/* ========================= */}
        {/* CONNEXION */}
        {/* ========================= */}

        <section className="flex items-center px-7 py-8 sm:px-10 lg:px-12">

          <div className="w-full">

            {/* Identité */}
            <div className="mb-7 flex items-center gap-2.5">

              <div className="
                flex h-9 w-9
                items-center justify-center
                rounded-lg
                bg-blue-50
                text-blue-800
                dark:bg-blue-950/50
                dark:text-blue-300
              ">
                <Shield className="h-4.5 w-4.5" />
              </div>

              <div>
                <p className="
                  text-xs font-black uppercase tracking-wider
                  text-slate-800 dark:text-slate-100
                ">
                  Gestion de Stock
                </p>

                <p className="
                  text-[10px]
                  text-slate-400 dark:text-slate-500
                ">
                  Système hospitalier
                </p>
              </div>

            </div>


            {/* Titre */}
            <div className="mb-6">

              <h1 className="
                text-2xl font-black
                text-slate-900 dark:text-white
              ">
                Connexion
              </h1>

              <p className="
                mt-1 text-xs
                text-slate-500 dark:text-slate-400
              ">
                Connectez-vous à votre espace sécurisé.
              </p>

            </div>


            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Identifiant */}
              <div>

                <label className="
                  text-[11px] font-bold
                  text-slate-600 dark:text-slate-400
                ">
                  Identifiant
                </label>

                <div className="relative mt-1.5">

                  <User className="
                    absolute left-3 top-1/2
                    h-4 w-4
                    -translate-y-1/2
                    text-slate-400
                  " />

                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Entrez votre identifiant"
                    required
                    className="
                      h-11 w-full
                      rounded-lg
                      border border-slate-200
                      bg-slate-50
                      pl-10 pr-3
                      text-sm text-slate-800
                      outline-none
                      transition-colors
                      placeholder:text-slate-400
                      focus:border-blue-700
                      focus:ring-1 focus:ring-blue-700
                      dark:border-slate-700
                      dark:bg-slate-800
                      dark:text-slate-100
                    "
                  />

                </div>

              </div>


              {/* Mot de passe */}
              <div>

                <div className="flex items-center justify-between">

                  <label className="
                    text-[11px] font-bold
                    text-slate-600 dark:text-slate-400
                  ">
                    Mot de passe
                  </label>

                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="
                      text-[10px] font-bold
                      text-blue-700
                      hover:underline
                      dark:text-blue-300
                    "
                  >
                    Mot de passe oublié ?
                  </button>

                </div>

                <div className="relative mt-1.5">

                  <Lock className="
                    absolute left-3 top-1/2
                    h-4 w-4
                    -translate-y-1/2
                    text-slate-400
                  " />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="
                      h-11 w-full
                      rounded-lg
                      border border-slate-200
                      bg-slate-50
                      pl-10 pr-11
                      text-sm text-slate-800
                      outline-none
                      transition-colors
                      placeholder:text-slate-400
                      focus:border-blue-700
                      focus:ring-1 focus:ring-blue-700
                      dark:border-slate-700
                      dark:bg-slate-800
                      dark:text-slate-100
                    "
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    className="
                      absolute right-3 top-1/2
                      -translate-y-1/2
                      text-slate-400
                      transition-colors
                      hover:text-blue-700
                    "
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>

                </div>

              </div>


              {/* Erreur */}
              {loginError && (
                <div className="
                  rounded-lg
                  border border-red-100
                  bg-red-50
                  px-3 py-2.5
                  dark:border-red-900/50
                  dark:bg-red-950/30
                ">
                  <p className="
                    text-xs font-medium
                    text-red-700 dark:text-red-300
                  ">
                    {loginError}
                  </p>
                </div>
              )}


              {/* Connexion */}
              <button
                type="submit"
                disabled={loading}
                className="
                  mt-2 flex h-11 w-full
                  items-center justify-center
                  rounded-lg
                  bg-blue-800
                  text-xs font-black uppercase
                  tracking-wider text-white
                  transition-all
                  hover:bg-blue-700
                  active:scale-[0.99]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>

            </form>

          </div>

        </section>


        {/* ========================= */}
        {/* IDENTITÉ VISUELLE */}
        {/* ========================= */}

        <section className="
          relative hidden
          min-h-[420px]
          items-center justify-center
          overflow-hidden
          border-l border-blue-100
          bg-blue-50
          lg:flex
          dark:border-slate-700
          dark:bg-slate-800
        ">

          {/* Cadre */}
          <div className="
            relative
            flex h-[300px] w-[300px]
            items-center justify-center
            rounded-2xl
            border border-blue-200/70
            dark:border-slate-700
          ">

            {/* Icône haut */}
            <div className="
              absolute top-5
              flex h-9 w-9
              items-center justify-center
              rounded-lg
              bg-white text-blue-700
              shadow-sm
              dark:bg-slate-900
              dark:text-blue-300
            ">
              <Package className="h-4 w-4" />
            </div>


            {/* Icône gauche */}
            <div className="
              absolute left-5
              flex h-9 w-9
              items-center justify-center
              rounded-lg
              bg-white text-blue-700
              shadow-sm
              dark:bg-slate-900
              dark:text-blue-300
            ">
              <BarChart3 className="h-4 w-4" />
            </div>


            {/* Icône droite */}
            <div className="
              absolute right-5
              flex h-9 w-9
              items-center justify-center
              rounded-lg
              bg-white text-blue-700
              shadow-sm
              dark:bg-slate-900
              dark:text-blue-300
            ">
              <Bell className="h-4 w-4" />
            </div>


            {/* Centre */}
            <div className="text-center">

              <div className="
                mx-auto flex h-16 w-16
                items-center justify-center
                rounded-2xl
                bg-blue-100
                text-blue-800
                dark:bg-blue-950/60
                dark:text-blue-300
              ">
                <Activity className="h-8 w-8" />
              </div>

              <h2 className="
                mt-5 text-sm font-black
                text-slate-800 dark:text-white
              ">
                Gestion intelligente
              </h2>

              <p className="
                mt-1 text-[11px]
                text-slate-500 dark:text-slate-400
              ">
                du stock hospitalier
              </p>

            </div>


            {/* IA */}
            <div className="
              absolute bottom-5
              flex h-9 w-9
              items-center justify-center
              rounded-lg
              bg-white text-amber-500
              shadow-sm
              dark:bg-slate-900
            ">
              <Sparkles className="h-4 w-4" />
            </div>

          </div>

        </section>

      </motion.div>

    </main>

  </div>
);
}