import React, { useState } from 'react';
import { Mail, Phone, Award, ShieldAlert, Key, LogOut, MapPin, Edit, Check, Bell, AlertTriangle } from 'lucide-react';
import { UserProfile, NotificationPrefs } from '../types';

interface ProfilViewProps {
  user: UserProfile;
  prefs: NotificationPrefs;
  onUpdatePrefs: (prefs: NotificationPrefs) => void;
  onLogout: () => void;
  onChangePassword: (oldPass: string, newPass: string) => Promise<boolean>;
}

export default function ProfilView({ 
  user, 
  prefs, 
  onUpdatePrefs, 
  onLogout, 
  onChangePassword 
}: ProfilViewProps) {
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  // Toggle helpers
  const handleToggleRupture = (checked: boolean) => {
    onUpdatePrefs({
      ...prefs,
      ruptureAlerts: checked
    });
  };

  const handleToggleExpiration = (checked: boolean) => {
    onUpdatePrefs({
      ...prefs,
      expirationAlerts: checked
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);

    if (newPass !== confirmPass) {
      setPassError('Le nouveau mot de passe et sa confirmation ne correspondent pas !');
      return;
    }

    if (newPass.length < 6) {
      setPassError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    const success = await onChangePassword(oldPass, newPass);
    if (success) {
      setPassSuccess(true);
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => {
        setPassModalOpen(false);
        setPassSuccess(false);
      }, 1500);
    } else {
      setPassError('L\'ancien mot de passe fourni est incorrect.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Profile Hero Section */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xs text-center md:text-left">
        
        {/* Profile Image with Edit button overlay */}
        <div className="relative group shrink-0 select-none">
          <img 
            alt="Portrait of clinical user" 
            referrerPolicy="no-referrer"
            className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-4 border-blue-50 shadow-sm" 
            src={user.avatar}
          />
          <div className="absolute bottom-1 right-1 bg-blue-800 text-white p-2 rounded-full border-4 border-white shadow-md cursor-pointer hover:bg-blue-700 transition-colors">
            <Edit className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Identity Information */}
        <div>
          <h2 className="text-2xl font-black text-slate-800 leading-none">{user.name}</h2>
          <p className="text-sm text-slate-500 font-bold mt-1.5">{user.roleName}</p>
          
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-slate-400 mt-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-black uppercase tracking-wider">Hôpital Central</span>
          </div>
        </div>

      </section>

      {/* Personal Info categories list */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
          Informations personnelles
        </h3>
        
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-xs">
          
          {/* Email row */}
          <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4 min-w-0">
              <Mail className="w-5 h-5 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase leading-none">EMAIL</p>
                <p className="text-xs font-bold text-slate-800 truncate mt-1">{user.email}</p>
              </div>
            </div>
            <span className="text-slate-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Modifier</span>
          </div>

          {/* Phone row */}
          <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <Phone className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase leading-none">TÉLÉPHONE</p>
                <p className="text-xs font-bold text-slate-800 mt-1">{user.phone}</p>
              </div>
            </div>
            <span className="text-slate-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Modifier</span>
          </div>

          {/* Employee ID row */}
          <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <Award className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase leading-none">ID EMPLOYÉ</p>
                <p className="text-xs font-bold text-slate-800 mt-1">{user.employeeId}</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-bold tracking-wider uppercase bg-slate-55 px-2 py-0.5 rounded border border-slate-100">Certifié</span>
          </div>

        </div>
      </div>

      {/* Notification Preferences category list */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
          Préférences de notifications
        </h3>
        
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-xs">
          
          {/* Rupture switch toggle */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4 pr-4">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="text-xs font-extrabold text-slate-800">Alertes de rupture</p>
                <p className="text-[11px] text-slate-450 mt-0.5 font-medium">Alerte immédiate en cas de seuil de stock critique</p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={prefs.ruptureAlerts}
                onChange={(e) => handleToggleRupture(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-800"></div>
            </label>
          </div>

          {/* Expiration switch toggle */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4 pr-4">
              <Bell className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-xs font-extrabold text-slate-800">Expirations</p>
                <p className="text-[11px] text-slate-450 mt-0.5 font-medium">Notifications quotidiennes pour les fins de vie de lots proches</p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={prefs.expirationAlerts}
                onChange={(e) => handleToggleExpiration(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-800"></div>
            </label>
          </div>

        </div>
      </div>

      {/* Security Actions Category list */}
      <div className="space-y-3 pt-2">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
          Sécurité et Actions
        </h3>
        
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-xs">
          
          {/* Change password button cell */}
          <button 
            onClick={() => setPassModalOpen(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors group text-left"
          >
            <div className="flex items-center gap-4">
              <Key className="w-5 h-5 text-slate-400" />
              <p className="text-xs font-extrabold text-slate-800">Changer le mot de passe</p>
            </div>
            <span className="text-slate-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Modifier</span>
          </button>

          {/* Logout button cell */}
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50/40 transition-colors group text-left"
          >
            <div className="flex items-center gap-4">
              <LogOut className="w-5 h-5 text-red-600" />
              <p className="text-xs font-black text-red-650">Déconnexion</p>
            </div>
            <LogOut className="w-4 h-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

        </div>
      </div>

      {/* Change password dialog modal */}
      {passModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 p-6 space-y-4">
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Modifier le mot de passe</h3>
                <p className="text-xs text-slate-400 mt-0.5">Assurez-vous de saisir des valeurs robustes</p>
              </div>
              <button 
                onClick={() => setPassModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-base p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              
              {/* Old password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Mot de passe actuel
                </label>
                <input 
                  type="password"
                  required
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800"
                />
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Nouveau mot de passe
                </label>
                <input 
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800"
                />
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Confirmer le mot de passe
                </label>
                <input 
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800"
                />
              </div>

              {passError && (
                <div className="flex items-center gap-1.5 text-xs text-red-650 bg-red-50 p-2.5 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Mot de passe modifié avec succès !</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setPassModalOpen(false)}
                  className="flex-1 border border-slate-200 py-3 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-800 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-blue-700 transition-colors active:scale-[0.98]"
                >
                  Valider
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
