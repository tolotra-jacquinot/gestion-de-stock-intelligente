import { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function ResetPassword() {

    const { uidb64, token } = useParams();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();

        if (password !== confirmPassword) {
            alert("Les mots de passe ne correspondent pas.");
            return;
        }

        if (!uidb64 || !token) {
            alert("Lien invalide.");
            return;
        }

        setLoading(true);

        try {

            await axios.post(
                `http://127.0.0.1:8000/api/reset-password/${uidb64}/${token}/`,
                {
                    password,
                }
            );

            alert("Mot de passe modifié avec succès.");

            navigate("/");

        } catch (error) {

            alert("Lien invalide ou expiré.");

            console.log(error);

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="min-h-screen flex items-center justify-center bg-slate-100">

            <div className="bg-white rounded-xl shadow-lg p-8 w-[420px]">

                <h1 className="text-2xl font-bold text-blue-800 mb-2">

                    Nouveau mot de passe

                </h1>

                <p className="text-gray-500 mb-6">

                    Choisissez un nouveau mot de passe sécurisé.

                </p>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >

                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />

                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Nouveau mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-500"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />

                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirmer le mot de passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-3 text-slate-500"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-800 hover:bg-blue-900 text-white rounded-lg p-3 transition"
                    >

                        {
                            loading
                                ? "Modification..."
                                : "Modifier le mot de passe"
                        }

                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="w-full border border-gray-300 rounded-lg p-3 hover:bg-gray-100 transition"
                    >

                        Retour à la connexion

                    </button>

                </form>

            </div>

        </div>

    );

}