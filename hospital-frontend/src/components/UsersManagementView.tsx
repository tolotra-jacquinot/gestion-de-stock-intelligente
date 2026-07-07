import React, { useState } from 'react';
import { User, Shield, ShieldAlert, HeartPulse, Package, FileSpreadsheet, Plus, Trash2, Edit2, Check, X, Mail } from 'lucide-react';
import { UserAccount, UserRole } from '../types';

interface UsersManagementViewProps {
  users: UserAccount[];
  onAddUser: (name: string, email: string, role: UserRole) => void;
  onUpdateUserRole: (id: string, role: UserRole) => void;
  onDeleteUser: (id: string) => void;
}

export default function UsersManagementView({
  users,
  onAddUser,
  onUpdateUserRole,
  onDeleteUser
}: UsersManagementViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('magasinier');
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('magasinier');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    onAddUser(newUserName, newUserEmail, newUserRole);
    setNewUserName('');
    setNewUserEmail('');
    setIsAdding(false);
  };

  const startEdit = (user: UserAccount) => {
    setEditingUserId(user.id);
    setEditRole(user.role);
  };

  const saveEdit = (id: string) => {
    onUpdateUserRole(id, editRole);
    setEditingUserId(null);
  };

  // Icon mapping for roles
  const getRoleIconAndColor = (role: UserRole) => {
    switch (role) {
      case 'administrateur':
        return {
          icon: <Shield className="w-4 h-4" />,
          label: 'Admin',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-100',
        };
      case 'pharmacien':
        return {
          icon: <HeartPulse className="w-4 h-4" />,
          label: 'Pharmacien',
          badgeClass: 'bg-emerald-50 text-emerald-750 border-emerald-100',
        };
      case 'magasinier':
        return {
          icon: <Package className="w-4 h-4" />,
          label: 'Magasinier',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-100',
        };
      case 'responsable':
        return {
          icon: <FileSpreadsheet className="w-4 h-4" />,
          label: 'Directeur Log.',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-100',
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 leading-none">Gestion des utilisateurs</h2>
          <p className="text-sm text-slate-500 mt-1.5">Configurez les comptes, attribuez des rôles et gérez les permissions d'accès.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Fermer le formulaire' : 'Créer un utilisateur'}
        </button>
      </div>

      {/* Slide down Add User Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            Nouveau compte collaborateur
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Name input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase">Nom complet</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="ex: Dr. Marie Dupont"
                className="w-full border border-slate-200 p-2 rounded-lg text-sm text-slate-800 focus:ring-1 focus:ring-blue-800 outline-none"
              />
            </div>

            {/* Email input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase">Adresse Email</label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="ex: marie.dupont@hopital.mg"
                className="w-full border border-slate-200 p-2 rounded-lg text-sm text-slate-800 focus:ring-1 focus:ring-blue-800 outline-none"
              />
            </div>

            {/* Role select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase">Rôle / Droits</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="w-full border border-slate-200 p-2 rounded-lg text-sm text-slate-800 focus:ring-1 focus:ring-blue-800 outline-none bg-white"
              >
                <option value="pharmacien">Pharmacien (Régulateur stock)</option>
                <option value="magasinier">Magasinier (Physique & Mouvements)</option>
                <option value="administrateur">Administrateur (Supervision totale)</option>
                <option value="responsable">Directeur / Responsable (IA & Rapports)</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-blue-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-blue-700 transition"
            >
              Enregistrer l'utilisateur
            </button>
          </div>
        </form>
      )}

      {/* Permissions Matrix quick cheat sheet card */}
      <section className="bg-slate-100/60 rounded-xl p-4 border border-slate-200 flex flex-col md:flex-row items-center gap-4 text-xs">
        <div className="bg-blue-100 text-blue-900 p-2 rounded-lg">
          <ShieldAlert className="w-5 h-5 shrink-0" />
        </div>
        <div>
          <span className="font-extrabold text-slate-700">Rappel des droits applicatifs :</span>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-1.5 text-slate-500 text-[11px]">
            <div><strong className="text-purple-700">Admin:</strong> Tout pouvoir (utilisateurs, alertes, fiches).</div>
            <div><strong className="text-emerald-700">Pharmacien:</strong> Ajout produits, alertes de rupture, IA.</div>
            <div><strong className="text-blue-700">Magasinier:</strong> Entrées/Sorties physiques, visuel stock.</div>
            <div><strong className="text-amber-700">Directeur:</strong> Consultation des prédictions IA & stats (lecture seule).</div>
          </div>
        </div>
      </section>

      {/* Users list table card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200">
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Identité / Collaborateur</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">E-mail de connexion</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Rôle / Accès</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Date de création</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((item) => {
                const roleDetails = getRoleIconAndColor(item.role);
                const isEditing = editingUserId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-colors text-xs text-slate-705">
                    
                    {/* Name & Avatar mockup */}
                    <td className="p-4 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center border border-slate-200 select-none">
                          {item.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 leading-tight">{item.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">ID: {item.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-450" />
                        <span>{item.email}</span>
                      </div>
                    </td>

                    {/* Role / Access cell */}
                    <td className="p-4">
                      {isEditing ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="border border-slate-300 p-1 rounded-md text-xs bg-white focus:outline-none focus:border-blue-800"
                        >
                          <option value="pharmacien">Pharmacien</option>
                          <option value="magasinier">Magasinier</option>
                          <option value="administrateur">Administrateur</option>
                          <option value="responsable">Directeur (IA)</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border leading-none ${roleDetails.badgeClass}`}>
                          {roleDetails.icon}
                          <span>{roleDetails.label}</span>
                        </span>
                      )}
                    </td>

                    {/* Created date */}
                    <td className="p-4 text-slate-400 font-medium">{item.createdAt}</td>

                    {/* Actions buttons */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg border border-emerald-100"
                              title="Valider"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="text-slate-500 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(item)}
                              className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-1.5 rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                              title="Modifier le rôle"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            
                            {/* Guard to prevent deleting the default admin account easily */}
                            {item.email !== 'admin.stock@hopitalcentral.fr' && (
                              <button
                                onClick={() => onDeleteUser(item.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
