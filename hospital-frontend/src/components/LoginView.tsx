import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, HeartPulse, Package, ShieldCheck, Sparkles, Shield, FileSpreadsheet } from 'lucide-react';
import { UserRole, UserProfile } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('martin.chef@hopitalcentral.fr');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRole>('pharmacien');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'pharmacien') {
      setUsername('martin.chef@hopitalcentral.fr');
    } else if (selectedRole === 'magasinier') {
      setUsername('j.moreau@hopitalcentral.fr');
    } else if (selectedRole === 'administrateur') {
      setUsername('admin.stock@hopitalcentral.fr');
    } else if (selectedRole === 'responsable') {
      setUsername('directeur@hopitalcentral.fr');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userProfile: UserProfile = {
      name: 
        role === 'pharmacien' ? 'Dr. Martin' : 
        role === 'magasinier' ? 'M. Jean Moreau' : 
        role === 'administrateur' ? 'Directeur Admin' : 'Dr. Sarah Ben',
      roleName: 
        role === 'pharmacien' ? 'Pharmacien Chef' : 
        role === 'magasinier' ? 'Magasinier Principal' : 
        role === 'administrateur' ? 'Administrateur Général' : 'Directeur Logistique',
      role,
      email: username,
      phone: 
        role === 'pharmacien' ? '+33 1 23 45 67 89' : 
        role === 'magasinier' ? '+33 6 45 89 12 30' : 
        role === 'administrateur' ? '+33 1 40 22 55 00' : '+33 6 12 34 56 78',
      employeeId: 
        role === 'pharmacien' ? 'HC-7742-PHARM' : 
        role === 'magasinier' ? 'HC-9421-STOCK' : 
        role === 'administrateur' ? 'HC-0010-ADMIN' : 'HC-0044-DIR',
      avatar: 
        role === 'pharmacien' 
          ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-9xpdqwukb59X4in-dwW0ybgt5Lqm0LsPBn0Egflez4tsI2tPq7qLqPvqd-wasc9jMqb959mkKP5qLbKm-1tEwPrTJuR_aLulXHqUR8w4feJAHgGcotSKFu60sTzA3noOl7LUcRwT--mNEY4Y1YFDh4PWRxTOYocfBVYFaIlDLOptR9c6wXxdGXueQdEwrd0x6YRhzl_QiPgyxUDJ55Y7gU1iJplZk8aVZqcfzU2mdtJ-ORi7jYO3sPcN1oh6Pu4ZkYSa4S17Hg'
          : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'
    };

    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(userProfile);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      
      {/* Decorative gradient background blur */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-[10%] -left-[5%] w-1/2 h-1/2 rounded-full blur-[120px] bg-sky-200"></div>
        <div className="absolute -bottom-[10%] -right-[5%] w-1/2 h-1/2 rounded-full blur-[120px] bg-blue-150"></div>
      </div>

      <div className="w-full max-w-md">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-blue-800 p-4 rounded-2xl mb-4 shadow-md text-white">
            <Shield className="w-12 h-12 stroke-[1.5]" />
          </div>
          <h1 className="text-3xl font-bold text-blue-900 tracking-tight">Gestion de Stock</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Interface d'accès hospitalier sécurisé</p>
        </div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ID or Email Field */}
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-600 mb-2 uppercase" htmlFor="username">
                Identifiant ou Email
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  id="username" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: dr.martin@hopital.fr"
                  className="w-full h-12 pl-12 pr-4 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-sm text-slate-800"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-600 mb-2 uppercase" htmlFor="password">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="password" 
                  id="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-12 pr-4 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-sm text-slate-800"
                />
              </div>
            </div>

            {/* Role Selection Tabs */}
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-600 mb-2 uppercase">
                Sélectionner un rôle de démonstration
              </label>
              <div className="grid grid-cols-2 gap-2">
                
                {/* Pharmacien */}
                <button
                  type="button"
                  onClick={() => handleRoleChange('pharmacien')}
                  className={`flex flex-col items-center justify-center p-2.5 border rounded-lg transition-all ${
                    role === 'pharmacien' 
                      ? 'border-blue-700 bg-blue-50 text-blue-800 font-bold' 
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <HeartPulse className={`w-4 h-4 mb-1 ${role === 'pharmacien' ? 'text-blue-700' : 'text-slate-400'}`} />
                  <span className="text-[11px] tracking-tight">Pharmacien</span>
                </button>

                {/* Magasinier */}
                <button
                  type="button"
                  onClick={() => handleRoleChange('magasinier')}
                  className={`flex flex-col items-center justify-center p-2.5 border rounded-lg transition-all ${
                    role === 'magasinier' 
                      ? 'border-blue-700 bg-blue-50 text-blue-800 font-bold' 
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Package className={`w-4 h-4 mb-1 ${role === 'magasinier' ? 'text-blue-700' : 'text-slate-400'}`} />
                  <span className="text-[11px] tracking-tight">Magasinier</span>
                </button>

                {/* Admin */}
                <button
                  type="button"
                  onClick={() => handleRoleChange('administrateur')}
                  className={`flex flex-col items-center justify-center p-2.5 border rounded-lg transition-all ${
                    role === 'administrateur' 
                      ? 'border-blue-700 bg-blue-50 text-blue-800 font-bold' 
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className={`w-4 h-4 mb-1 ${role === 'administrateur' ? 'text-blue-700' : 'text-slate-400'}`} />
                  <span className="text-[11px] tracking-tight">Administrateur</span>
                </button>

                {/* Responsable */}
                <button
                  type="button"
                  onClick={() => handleRoleChange('responsable')}
                  className={`flex flex-col items-center justify-center p-2.5 border rounded-lg transition-all ${
                    role === 'responsable' 
                      ? 'border-blue-700 bg-blue-50 text-blue-800 font-bold' 
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className={`w-4 h-4 mb-1 ${role === 'responsable' ? 'text-blue-700' : 'text-slate-400'}`} />
                  <span className="text-[11px] tracking-tight">Directeur (IA)</span>
                </button>

              </div>
            </div>

            {/* Submit button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-800 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Connexion en cours...</span>
                </div>
              ) : (
                'Se connecter'
              )}
            </button>

            {/* Footer Forgot Password */}
            <div className="text-center">
              <a href="#" className="text-xs text-blue-800 hover:underline hover:text-blue-700 transition-colors font-medium">
                Mot de passe oublié ?
              </a>
            </div>

          </form>
        </motion.div>

        {/* Desktop clinical quotes block (Desktop only) */}
        <div className="hidden lg:block mt-8 text-center text-slate-400">
          <p className="text-xs italic">
            "Précision clinique, réactivité logistique. L'excellence au service du patient."
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-blue-800" />
            <span>Système Certifié Hospitalier v4.1</span>
          </div>
        </div>

      </div>
    </div>
  );
}
