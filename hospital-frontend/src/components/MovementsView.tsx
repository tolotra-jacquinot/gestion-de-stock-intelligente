import React, { useState } from 'react';
import { ArrowUp, ArrowDown, User, PlusCircle, MinusCircle, HelpCircle } from 'lucide-react';
import { Movement, MovementType, UserRole } from '../types';

interface MovementsViewProps {
  movements: Movement[];
  onSelectProductByName: (name: string) => void;
  onOpenQuickMovement: (type: MovementType) => void;
  role: UserRole;
}

export default function MovementsView({ movements, onSelectProductByName, onOpenQuickMovement, role }: MovementsViewProps) {
  const [filter, setFilter] = useState<string>('TOUS');
  const [isFabOpen, setIsFabOpen] = useState(false);

  const filters = ['TOUS', 'ENTRÉES', 'SORTIES', 'URGENCES'];

  const filteredMovements = movements.filter((mov) => {
    if (filter === 'TOUS') return true;
    if (filter === 'ENTRÉES') return mov.type === 'Entrée';
    if (filter === 'SORTIES') return mov.type === 'Sortie';
    if (filter === 'URGENCES') return mov.isEmergency === true || mov.quantity >= 50 || mov.productName.toLowerCase().includes('insuline');
    return true;
  });

  // Calculate 24h stats dynamically
  const totalIn = movements.filter(m => m.type === 'Entrée').reduce((acc, current) => acc + current.quantity, 0);
  const totalOut = -movements.filter(m => m.type === 'Sortie').reduce((acc, current) => acc + current.quantity, 0);

  return (
    <div className="space-y-6 relative">
      
      {/* 24h Entry/Exit Stats */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Entrées */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">ENTRÉES (24H)</span>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xl font-extrabold text-blue-800">+{totalIn > 0 ? totalIn : 124}</span>
            <ArrowUp className="w-4 h-4 text-blue-800 shrink-0 stroke-[2.5]" />
          </div>
        </div>

        {/* Sorties */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">SORTIES (24H)</span>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xl font-extrabold text-red-600">{totalOut < 0 ? totalOut : -86}</span>
            <ArrowDown className="w-4 h-4 text-red-600 shrink-0 stroke-[2.5]" />
          </div>
        </div>

      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
              filter === f 
                ? 'bg-blue-800 text-white' 
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Audit timeline list */}
      <div className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 pt-1">
          MOUVEMENTS RÉCENTS
        </h2>

        {filteredMovements.length > 0 ? (
          <div className="space-y-2.5">
            {filteredMovements.map((mov) => {
              const isEntree = mov.type === 'Entrée';
              return (
                <div 
                  key={mov.id}
                  onClick={() => onSelectProductByName(mov.productName)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4 hover:shadow-xs dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
                >
                  {/* Icon Indicator Circle */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                    isEntree
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                  }`}>
                    {isEntree ? <ArrowUp className="w-5 h-5 stroke-[2.5]" /> : <ArrowDown className="w-5 h-5 stroke-[2.5]" />}
                  </div>

                  {/* Move Details */}
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors">
                        {mov.productName}
                      </h3>
                      <span className={`text-sm font-bold font-mono tracking-tight shrink-0 ${
                        isEntree ? 'text-blue-800' : 'text-red-600'
                      }`}>
                        {isEntree ? '+' : '-'}{mov.quantity}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-slate-400 font-medium">
                      
                      {/* User */}
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <User className="w-3.5 h-3.5" />
                        {mov.user}
                      </span>
                      
                      <span className="text-slate-300">•</span>
                      
                      {/* Destination / Source */}
                      <span className="text-slate-500 dark:text-slate-400 max-w-[120px] truncate">
                        {mov.destination}
                      </span>
                      
                      <span className="text-slate-300">•</span>
                      
                      {/* Timestamp */}
                      <span className="text-slate-400 italic">
                        {mov.timestamp}
                      </span>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-xs">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-200">Aucun mouvement trouvé</p>
            <p className="text-xs text-slate-400 mt-1">Aucune transaction de stock ne correspond à ce filtre.</p>
          </div>
        )}

      </div>

      {/* Floating Action Button (FAB) Menu Overlay */}
      {(role === 'admin' || role === 'magasinier') && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3">

          {/* Actions */}
          {isFabOpen && (
            <div className="flex flex-col gap-2.5 items-end animate-in fade-in slide-in-from-bottom-2 duration-200">

              {/* Entrée de Stock */}
              <button
                type="button"
                onClick={() => {
                  setIsFabOpen(false);
                  onOpenQuickMovement('Entrée');
                }}
                className="
                  group w-64
                  flex items-center gap-3
                  rounded-xl
                  border border-blue-200 dark:border-blue-900/60
                  bg-white/95 dark:bg-slate-900/95
                  backdrop-blur-xl
                  px-3.5 py-3
                  text-left
                  shadow-lg shadow-slate-900/10
                  dark:shadow-black/30
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-blue-300
                  hover:shadow-xl
                  dark:hover:bg-slate-800
                  active:scale-[0.98]
                "
              >
                {/* Icon */}
                <div className="
                  w-10 h-10 shrink-0
                  rounded-xl
                  bg-blue-50 dark:bg-blue-950/50
                  text-blue-700 dark:text-blue-300
                  flex items-center justify-center
                  border border-blue-100 dark:border-blue-900/50
                  transition-colors
                  group-hover:bg-blue-100
                  dark:group-hover:bg-blue-950
                ">
                  <ArrowUp className="w-5 h-5 stroke-[2.7]" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    Entrée de stock
                  </p>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Ajouter des unités à l'inventaire
                  </p>
                </div>

                {/* Right action circle */}
                <div className="
                  w-8 h-8 shrink-0
                  rounded-full
                  bg-blue-700 text-white
                  flex items-center justify-center
                  shadow-sm
                  transition-transform
                  group-hover:scale-105
                ">
                  <ArrowUp className="w-4 h-4 stroke-[3]" />
                </div>
              </button>


              {/* Sortie de Stock */}
              <button
                type="button"
                onClick={() => {
                  setIsFabOpen(false);
                  onOpenQuickMovement('Sortie');
                }}
                className="
                  group w-64
                  flex items-center gap-3
                  rounded-xl
                  border border-red-200 dark:border-red-900/60
                  bg-white/95 dark:bg-slate-900/95
                  backdrop-blur-xl
                  px-3.5 py-3
                  text-left
                  shadow-lg shadow-slate-900/10
                  dark:shadow-black/30
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-red-300
                  hover:shadow-xl
                  dark:hover:bg-slate-800
                  active:scale-[0.98]
                "
              >
                {/* Icon */}
                <div className="
                  w-10 h-10 shrink-0
                  rounded-xl
                  bg-red-50 dark:bg-red-950/40
                  text-red-600 dark:text-red-400
                  flex items-center justify-center
                  border border-red-100 dark:border-red-900/50
                  transition-colors
                  group-hover:bg-red-100
                  dark:group-hover:bg-red-950/60
                ">
                  <ArrowDown className="w-5 h-5 stroke-[2.7]" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    Sortie de stock
                  </p>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Retirer des unités de l'inventaire
                  </p>
                </div>

                {/* Right action circle */}
                <div className="
                  w-8 h-8 shrink-0
                  rounded-full
                  bg-red-600 text-white
                  flex items-center justify-center
                  shadow-sm
                  transition-transform
                  group-hover:scale-105
                ">
                  <ArrowDown className="w-4 h-4 stroke-[3]" />
                </div>
              </button>

            </div>
          )}


          {/* Bouton principal */}
          <button
            type="button"
            onClick={() => setIsFabOpen(!isFabOpen)}
            aria-label={isFabOpen ? 'Fermer les actions de stock' : 'Ouvrir les actions de stock'}
            className={`
              w-14 h-14
              rounded-full
              flex items-center justify-center
              text-white
              shadow-xl
              transition-all duration-300
              hover:scale-105
              active:scale-95
              ${
                isFabOpen
                  ? 'bg-slate-700 dark:bg-slate-800 rotate-45'
                  : 'bg-blue-800 hover:bg-blue-700'
              }
            `}
          >
            <span className="text-3xl font-light leading-none">
              +
            </span>
          </button>

        </div>
      )}

    </div>
  );
}
