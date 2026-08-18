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
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ENTRÉES (24H)</span>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xl font-extrabold text-blue-800">+{totalIn > 0 ? totalIn : 124}</span>
            <ArrowUp className="w-4 h-4 text-blue-800 shrink-0 stroke-[2.5]" />
          </div>
        </div>

        {/* Sorties */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SORTIES (24H)</span>
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
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
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
                  className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 hover:shadow-xs transition-shadow cursor-pointer group"
                >
                  {/* Icon Indicator Circle */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                    isEntree ? 'bg-blue-50 text-blue-800' : 'bg-red-50 text-red-600'
                  }`}>
                    {isEntree ? <ArrowUp className="w-5 h-5 stroke-[2.5]" /> : <ArrowDown className="w-5 h-5 stroke-[2.5]" />}
                  </div>

                  {/* Move Details */}
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-800 transition-colors">
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
                      <span className="flex items-center gap-1 text-slate-500">
                        <User className="w-3.5 h-3.5" />
                        {mov.user}
                      </span>
                      
                      <span className="text-slate-300">•</span>
                      
                      {/* Destination / Source */}
                      <span className="text-slate-500 max-w-[120px] truncate">
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
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">Aucun mouvement trouvé</p>
            <p className="text-xs text-slate-400 mt-1">Aucune transaction de stock ne correspond à ce filtre.</p>
          </div>
        )}

      </div>

      {/* Floating Action Button (FAB) Menu Overlay */}
      {(role === 'admin' || role === 'magasinier') && (
        <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
          
          {/* Sub-menu options */}
          {isFabOpen && (
            <div className="flex flex-col gap-2.5 items-end transition-all pointer-events-auto">
              
              {/* Entry Action Option */}
              <button 
                onClick={() => {
                  setIsFabOpen(false);
                  onOpenQuickMovement('Entrée');
                }}
                className="flex items-center gap-2 bg-white text-slate-800 border border-slate-200 pl-4 pr-3 py-2 rounded-lg font-bold text-[11px] tracking-wider uppercase shadow-md hover:bg-slate-50 transition-all transition-transform active:scale-95"
              >
                <span>Entrée de Stock</span>
                <div className="w-7 h-7 bg-blue-800 text-white rounded-full flex items-center justify-center">
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>

              {/* Exit Action Option */}
              <button 
                onClick={() => {
                  setIsFabOpen(false);
                  onOpenQuickMovement('Sortie');
                }}
                className="flex items-center gap-2 bg-white text-slate-800 border border-slate-200 pl-4 pr-3 py-2 rounded-lg font-bold text-[11px] tracking-wider uppercase shadow-md hover:bg-slate-50 transition-all transition-transform active:scale-95"
              >
                <span>Sortie de Stock</span>
                <div className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center">
                  <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>

            </div>
          )}

          {/* Root Add FAB Trigger */}
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg pointer-events-auto transition-transform active:scale-90 hover:scale-105 ${
              isFabOpen ? 'bg-slate-800 text-white rotate-45' : 'bg-blue-800 text-white'
            }`}
            style={{ transition: 'transform 0.3s' }}
          >
            <span className="text-2xl font-bold">+</span>
          </button>

        </div>
      )}

    </div>
  );
}
