import React, { useState } from 'react';
import { User, Shield, ShieldAlert, HeartPulse, Package, FileSpreadsheet, Plus, Trash2, Edit2, Check, X, Mail } from 'lucide-react';
import { UserAccount, UserRole } from '../types';

interface UsersManagementViewProps {
  users: UserAccount[];

  onAddUser: (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => Promise<boolean>;

  onUpdateUserRole: (
    id: string,
    role: UserRole
  ) => Promise<boolean>;
  
  onDeleteUser: (
    id: string
  ) => Promise<boolean>;
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
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  
  const [newUserRole, setNewUserRole] = useState<UserRole>('magasinier');
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('magasinier');

  const [userToDelete, setUserToDelete] =
    useState<UserAccount | null>(null);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newUserName ||
      !newUserEmail ||
      !newUserPassword
    ) {
      return;
    }
  
    setIsCreating(true);

    const success = await onAddUser(
      newUserName,
      newUserEmail,
      newUserPassword,
      newUserRole
    );

    setIsCreating(false);

    if (success) {
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('magasinier');
      setIsAdding(false);
    }
  };

  const startEdit = (user: UserAccount) => {
    setEditingUserId(user.id);
    setEditRole(user.role);
  };

  const saveEdit = async (id: string) => {
    setIsUpdatingRole(true);

    const success = await onUpdateUserRole(
      id,
      editRole
    );

    setIsUpdatingRole(false);

    if (success) {
      setEditingUserId(null);
    }
  };

  const handleDelete = (user: UserAccount) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) {
      return;
    }

    setIsDeleting(true);

    const success = await onDeleteUser(
      userToDelete.id
    );

    setIsDeleting(false);

    if (success) {
      setUserToDelete(null);
    }
  };

  // Icon mapping for roles
  const getRoleIconAndColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          icon: <Shield className="w-4 h-4" />,
          label: 'Administrateur',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-100',
        };
      case 'pharmacien':
        return {
          icon: <HeartPulse className="w-4 h-4" />,
          label: 'Pharmacien',
          badgeClass:
            'bg-emerald-100 text-emerald-900 border-emerald-300 ' +
            'dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
        };
      case 'magasinier':
        return {
          icon: <Package className="w-4 h-4" />,
          label: 'Magasinier',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-100',
        };
      case 'directeur':
        return {
          icon: <FileSpreadsheet className="w-4 h-4" />,
          label: 'Directeur',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-100',
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">Gestion des utilisateurs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Configurez les comptes, attribuez des rôles et gérez les permissions d'accès.</p>
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
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            Nouveau compte collaborateur
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Name input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Identifiant</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="ex: Dr. Claudin"
                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-blue-800 outline-none"
              />
            </div>

            {/* Email input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Adresse Email</label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="ex: ex@gmail.com"
                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-blue-800 outline-none"
              />
            </div>

            {/* Password input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Mot de passe
            </label>

            <input
              type="password"
              required
              value={newUserPassword}
              onChange={(e) =>
                setNewUserPassword(e.target.value)
              }
              placeholder="ex: User000."
              className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-blue-800 outline-none"
            />
          </div>

            {/* Role select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Rôle / Droits</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="w-full border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-800 outline-none bg-white dark:bg-slate-800"
              >
                <option value="pharmacien">Pharmacien (Régulateur stock)</option>
                <option value="magasinier">Magasinier (Physique & Mouvements)</option>
                <option value="admin">Administrateur (Supervision totale)</option>
                <option value="directeur">Directeur (IA & Rapports)</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isCreating}
              className="bg-blue-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCreating ? "Création..." : "Enregistrer l'utilisateur"}
            </button>
          </div>
        </form>
      )}

      {/* Permissions Matrix quick cheat sheet card */}
      <section className="bg-slate-100/60 dark:bg-slate-900/70 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4 text-xs transition-colors">
        <div className="bg-blue-100 text-blue-900 p-2 rounded-lg">
          <ShieldAlert className="w-5 h-5 shrink-0 dark:icon-slate-500 leading-tight" />
        </div>
        <div>
          <span className="font-extrabold text-slate-700 dark:text-slate-200">Rappel des droits applicatifs :</span>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
            <div><strong className="text-purple-700">Admin:</strong> Tout pouvoir (utilisateurs, alertes, fiches).</div>
            <div><strong className="text-emerald-700">Pharmacien:</strong> Ajout produits, alertes de rupture, IA.</div>
            <div><strong className="text-blue-700">Magasinier:</strong> Entrées/Sorties physiques, visuel stock.</div>
            <div><strong className="text-amber-700">Directeur:</strong> Consultation des prédictions IA & stats (lecture seule).</div>
          </div>
        </div>
      </section>

      {/* Users list table card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Identité / Collaborateur</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">E-mail de connexion</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Rôle / Accès</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Date de création</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((item) => {
                const roleDetails = getRoleIconAndColor(item.role);
                const isEditing = editingUserId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/50 transition-colors text-xs text-slate-700 dark:text-slate-300">
                    
                    {/* Name & Avatar mockup */}
                    <td className="p-4 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black flex items-center justify-center border border-slate-200 dark:border-slate-700 select-none">
                          {item.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-100 leading-tight">{item.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">ID: {item.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{item.email}</span>
                      </div>
                    </td>

                    {/* Role / Access cell */}
                    <td className="p-4">
                      {isEditing ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="border border-slate-300 dark:border-slate-700 p-1 rounded-md text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-800"
                        >
                          <option value="pharmacien">Pharmacien</option>
                          <option value="magasinier">Magasinier</option>
                          <option value="admin">Administrateur</option>
                          <option value="directeur">Directeur (IA)</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border leading-none ${roleDetails.badgeClass}`}>
                          {roleDetails.icon}
                          <span>{roleDetails.label}</span>
                        </span>
                      )}
                    </td>

                    {/* Created date */}
                    <td className="p-4 text-slate-400 dark:text-slate-500 font-medium"> {item.createdAt}</td>

                    {/* Actions buttons */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(item.id)}
                              disabled={isUpdatingRole}
                              className="text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg border border-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Valider"
                            >
                              {isUpdatingRole ? (
                                <span className="text-[10px] font-bold px-1">
                                  ...
                                </span>
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              disabled={isUpdatingRole}
                              className="text-slate-500 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(item)}
                              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                              title="Modifier le rôle"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            
                            {/* Guard to prevent deleting the default admin account easily */}
                            {item.email !== 'admin.stock@hopitalcentral.fr' && (
                              <button
                                onClick={() => handleDelete(item)}
                                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded-lg border border-transparent hover:border-red-100 dark:hover:border-red-900 transition-colors"
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

    {userToDelete && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">

        <div className="w-full max-w-md rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl transition-colors">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Supprimer cet utilisateur ?
              </h3>

              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Vous êtes sur le point de supprimer le compte de{' '}
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {userToDelete.name}
                </span>.
              </p>

              <div className="mt-3 rounded-lg border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3">
                <p className="text-xs font-medium leading-relaxed text-red-700 dark:text-red-300">
                  Cette action est définitive. Cet utilisateur ne pourra
                  plus accéder à l’application.
                </p>
              </div>
            </div>

          </div>

          <div className="mt-6 flex gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">

            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setUserToDelete(null)}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>

            <button
              type="button"
              disabled={isDeleting}
              onClick={confirmDelete}
              className="flex-1 rounded-lg bg-red-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Suppression...
                </span>
              ) : (
                "Supprimer"
              )}
            </button>

          </div>

        </div>
      </div>
    )}

    </div>
  );
}
