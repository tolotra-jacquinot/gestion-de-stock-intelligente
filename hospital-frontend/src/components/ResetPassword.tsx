import { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPassword() {
  const { uidb64, token } = useParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!uidb64 || !token) {
      setError("Lien de réinitialisation invalide.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `http://127.0.0.1:8000/api/auth/reset-password/${uidb64}/${token}/`,
        {
          password,
        }
      );

      setSuccess("Mot de passe modifié avec succès.");

      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (error) {
      console.error("Erreur reset-password :", error);

      setError(
        "Ce lien de réinitialisation est invalide ou a expiré."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >

        {/* Retour */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="
            mb-4 inline-flex items-center gap-2
            text-xs font-bold
            text-slate-500 dark:text-slate-400
            hover:text-blue-700 dark:hover:text-blue-300
            transition-colors
          "
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </button>

        {/* Carte */}
        <div
          className="
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-800
            rounded-2xl shadow-sm
            p-6
          "
        >

          {/* Icône */}
          <div
            className="
              w-11 h-11
              rounded-xl
              bg-blue-50 dark:bg-blue-950/40
              text-blue-800 dark:text-blue-300
              flex items-center justify-center
              mb-5
            "
          >
            <Lock className="w-5 h-5" />
          </div>

          {/* Titre */}
          <div className="mb-6">
            <h1
              className="
                text-xl font-black
                text-slate-900 dark:text-slate-100
              "
            >
              Nouveau mot de passe
            </h1>

            <p
              className="
                text-sm
                text-slate-500 dark:text-slate-400
                mt-1.5
              "
            >
              Choisissez un nouveau mot de passe sécurisé.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* Nouveau mot de passe */}
            <div>
              <label
                className="
                  text-xs font-bold
                  text-slate-600 dark:text-slate-400
                "
              >
                Nouveau mot de passe
              </label>

              <div className="relative mt-1.5">

                <Lock
                  className="
                    absolute left-3 top-1/2
                    -translate-y-1/2
                    w-4 h-4
                    text-slate-400 dark:text-slate-500
                  "
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="
                    w-full h-11
                    pl-10 pr-11
                    rounded-lg
                    border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-800
                    text-sm
                    text-slate-800 dark:text-slate-100
                    placeholder:text-slate-400
                    dark:placeholder:text-slate-500
                    outline-none
                    focus:border-blue-700
                    focus:ring-1
                    focus:ring-blue-700
                    transition-colors
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="
                    absolute right-3 top-1/2
                    -translate-y-1/2
                    text-slate-400 dark:text-slate-500
                    hover:text-blue-700 dark:hover:text-blue-300
                    transition-colors
                  "
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>

              </div>
            </div>

            {/* Confirmation */}
            <div>
              <label
                className="
                  text-xs font-bold
                  text-slate-600 dark:text-slate-400
                "
              >
                Confirmer le mot de passe
              </label>

              <div className="relative mt-1.5">

                <Lock
                  className="
                    absolute left-3 top-1/2
                    -translate-y-1/2
                    w-4 h-4
                    text-slate-400 dark:text-slate-500
                  "
                />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  required
                  className="
                    w-full h-11
                    pl-10 pr-11
                    rounded-lg
                    border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-800
                    text-sm
                    text-slate-800 dark:text-slate-100
                    placeholder:text-slate-400
                    dark:placeholder:text-slate-500
                    outline-none
                    focus:border-blue-700
                    focus:ring-1
                    focus:ring-blue-700
                    transition-colors
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="
                    absolute right-3 top-1/2
                    -translate-y-1/2
                    text-slate-400 dark:text-slate-500
                    hover:text-blue-700 dark:hover:text-blue-300
                    transition-colors
                  "
                  aria-label={
                    showConfirmPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>

              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div
                className="
                  rounded-lg
                  border border-red-200
                  dark:border-red-900/50
                  bg-red-50
                  dark:bg-red-950/30
                  px-3 py-2.5
                "
              >
                <p
                  className="
                    text-xs font-medium
                    text-red-700
                    dark:text-red-300
                  "
                >
                  {error}
                </p>
              </div>
            )}

            {/* Succès */}
            {success && (
              <div
                className="
                  rounded-lg
                  border border-emerald-200
                  dark:border-emerald-900/50
                  bg-emerald-50
                  dark:bg-emerald-950/30
                  px-3 py-2.5
                "
              >
                <p
                  className="
                    text-xs font-medium
                    text-emerald-700
                    dark:text-emerald-300
                  "
                >
                  {success}
                </p>
              </div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading || !!success}
              className="
                w-full h-11
                bg-blue-800
                hover:bg-blue-700
                disabled:opacity-60
                disabled:cursor-not-allowed
                text-white
                text-sm font-bold
                rounded-lg
                transition-colors
                flex items-center justify-center
              "
            >
              {loading
                ? "Modification..."
                : success
                  ? "Mot de passe modifié"
                  : "Modifier le mot de passe"
              }
            </button>

          </form>

          {/* Sécurité */}
          <div
            className="
              mt-5 pt-4
              border-t border-slate-100 dark:border-slate-800
              flex items-center justify-center gap-1.5
              text-[11px]
              text-slate-400 dark:text-slate-500
            "
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Réinitialisation sécurisée
          </div>

        </div>

      </motion.div>

    </div>
  );
}