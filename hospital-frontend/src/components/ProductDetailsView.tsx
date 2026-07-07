import React, { useState } from 'react';
import { ArrowLeft, MapPin, Sparkles, TrendingUp, User, Clock, AlertTriangle, Check } from 'lucide-react';
import { Product, Movement, UserRole } from '../types';

interface ProductDetailsViewProps {
  product: Product;
  productMovements: Movement[];
  onBack: () => void;
  onApproveOrder: (productId: string, quantity: number) => void;
  onRegisterMove: (productId: string, quantity: number, type: 'Entrée' | 'Sortie', destination: string) => void;
  role: UserRole;
}

export default function ProductDetailsView({ 
  product, 
  productMovements, 
  onBack, 
  onApproveOrder, 
  onRegisterMove,
  role
}: ProductDetailsViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalQty, setModalQty] = useState('10');
  const [modalDest, setModalDest] = useState('Urgences');
  const [isOrdered, setIsOrdered] = useState(false);

  // Compute stock percentage
  const stockPercentage = Math.min(Math.round((product.stock / product.maxStock) * 100), 100);
  
  // Radial SVG calculation
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stockPercentage / 100) * circumference;

  const handleOrderApproval = () => {
    setIsOrdered(true);
    onApproveOrder(product.id, 50);
    setTimeout(() => {
      setIsOrdered(false);
    }, 2000);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(modalQty, 10);
    if (!isNaN(qty) && qty > 0) {
      onRegisterMove(product.id, qty, 'Sortie', modalDest);
      setModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Detail view banner navigation */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0 text-slate-600"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Détails Produit</h1>
      </div>

      {/* Product Box Metadata Section */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row gap-6 shadow-xs">
        
        {/* Isolated illustration image */}
        <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
          <img 
            alt="Pharmaceutical box visual"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover select-none" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDG6e9KB2F1GW7FIpbqtdNdv8wctjnHXmvNh6gwHQoQzLrXfRq7gHbrhAJq1gKEpI573T7c3CZmSfqCrpwyeT8mgXDUHcGdEQ1apu0lkfXss0mLx1Pdwr1U6M6GzrnAun6mqEKwt8dIGyiLL61GkRjvVXl9xzqGfvVexJQypEY58hneflIjmNElc5e2KqPWgVXWXTjRUZ83y5gijBmwgahkApJDcNnboqE77Wl-eNGwDgoy__6VaxtIlVXXc7wIMLh4jmik7qn2lQ"
          />
        </div>

        {/* Technical definitions details */}
        <div className="flex-grow space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                Code: {product.code}
              </span>
              <h2 className="text-2xl font-bold text-slate-800 mt-1">
                {product.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                {product.location}
              </p>
            </div>
            
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-3 py-1 rounded-full text-xs font-bold leading-normal tracking-wide shrink-0 shadow-xs">
              Actif
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            
            {/* Category */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
              <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Catégorie</p>
              <p className="text-sm font-bold text-slate-700 mt-1">{product.category}</p>
            </div>

            {/* Conditioning packaging */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
              <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Conditionnement</p>
              <p className="text-sm font-bold text-slate-700 mt-1">{product.packaging}</p>
            </div>

            {/* Unit Price */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
              <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Prix Unitaire</p>
              <p className="text-sm font-bold text-slate-700 mt-1">{product.unitPrice.toFixed(2)} €</p>
            </div>

            {/* Expiration date */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
              <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Péremption</p>
              <p className={`text-sm font-bold mt-1 ${product.status === 'PÉREMPTION' || product.expiration === 'PROCHE' ? 'text-red-600 font-extrabold' : 'text-slate-700'}`}>
                {product.expiration}
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* Grid of details: Gauge & Prediction */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Circular Stock Gauge */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center space-y-4 shadow-xs">
          <h3 className="w-full font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-2">
            État du Stock
          </h3>

          {/* Graphic radial loader */}
          <div className="relative w-40 h-40 flex items-center justify-center select-none">
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                cx="80" 
                cy="80" 
                r={radius} 
                className="text-slate-105 stroke-slate-100" 
                strokeWidth="11" 
                fill="transparent" 
              />
              <circle 
                cx="80" 
                cy="80" 
                r={radius} 
                className={`transition-all duration-1000 ${
                  product.stock === 0 ? 'text-red-600' : 'text-blue-800'
                }`}
                strokeWidth="11" 
                fill="transparent" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-800">{product.stock}</span>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mt-0.5">Unités</span>
            </div>
          </div>

          {/* Details lines */}
          <div className="w-full space-y-2.5 pt-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-450">Seuil Critique</span>
              <span className="font-extrabold text-slate-700">{product.minStock}</span>
            </div>
            
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-450">Stock Maximum</span>
              <span className="font-extrabold text-slate-700">{product.maxStock}</span>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  product.stock === 0 ? 'bg-red-600' : 'bg-blue-800'
                }`}
                style={{ width: `${stockPercentage}%` }}
              ></div>
            </div>
          </div>

        </div>

        {/* IA Smart Predictive Analysis */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 flex flex-col shadow-xs">
          
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-800 animate-pulse" />
              Analyse Prédictive IA
            </h3>
            
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 rounded-full border border-blue-100 shadow-xs">
              <span className="w-2 h-2 bg-blue-800 rounded-full animate-pulse shrink-0"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider">En Direct</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row gap-6">
            
            {/* SVG Visual Graphic */}
            <div className="flex-grow h-44 relative bg-slate-50 rounded-xl p-3 overflow-hidden border border-slate-100 select-none">
              
              {/* SVG drawing lines representing a medical inventory trend path */}
              <div className="absolute inset-0 flex items-end justify-between px-6 pb-4">
                <svg className="w-full h-full text-blue-800/80" viewBox="0 0 400 150">
                  <path 
                    d="M0,130 L50,110 L100,125 L150,90 L200,105 L250,75 L300,85 L350,45 L400,20" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeWidth="3.5" 
                  />
                  <path 
                    d="M0,130 L50,110 L100,125 L150,90 L200,105 L250,75 L300,85 L350,45 L400,20 L400,150 L0,150 Z" 
                    fill="currentColor" 
                    fillOpacity="0.05" 
                  />
                </svg>
              </div>

              {/* Grid content overlaid */}
              <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <span>Consommation Prévue (15j)</span>
                  <span className="text-blue-800 font-extrabold">Total estimé : 185u</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-400 px-1">
                  <span>J+1</span>
                  <span>J+5</span>
                  <span>J+10</span>
                  <span>J+15</span>
                </div>
              </div>

            </div>

            {/* Recommendation box Actions */}
            <div className="md:w-64 flex flex-col justify-between gap-4">
              
              <div className="bg-sky-50 border border-sky-150 p-4 rounded-xl shadow-xs">
                <div className="flex items-center gap-1.5 text-blue-800 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Recommandation</span>
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  Commander <span className="font-bold text-blue-900">50 unités</span> d'ici mardi pour écarter tout risque de rupture sous 12 jours.
                </p>
              </div>

              {role === 'administrateur' || role === 'pharmacien' ? (
                <button 
                  onClick={handleOrderApproval}
                  disabled={isOrdered}
                  className={`w-full h-11 rounded-lg text-xs tracking-wider uppercase font-extrabold transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.97] ${
                    isOrdered 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-blue-800 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isOrdered ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Commande Approuvée</span>
                    </>
                  ) : (
                    'Approuver la Commande'
                  )}
                </button>
              ) : (
                <div className="w-full text-center py-2.5 px-3 bg-slate-50 border border-slate-205 text-[11px] text-slate-500 font-bold rounded-lg leading-normal">
                  Approbation réservée aux pharmaciens et administrateurs
                </div>
              )}

            </div>

          </div>

        </div>

      </section>

      {/* Audit History Log for this specific product item */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">
            Historique des Mouvements
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {productMovements.length} transactions
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          {productMovements.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-450 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 pl-5">Type</th>
                  <th className="p-4">Quantité</th>
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">Provenance / Cible</th>
                  <th className="p-4 pr-5 whitespace-nowrap">Date & Heure</th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
                {productMovements.map((mov) => {
                  const isEntree = mov.type === 'Entrée';
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-5">
                        <span className={`inline-flex items-center gap-1.5 font-bold ${
                          isEntree ? 'text-blue-800' : 'text-red-600'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${isEntree ? 'bg-blue-800' : 'bg-red-600'}`}></span>
                          {mov.type}
                        </span>
                      </td>
                      <td className="p-4 font-extrabold">
                        <span className={isEntree ? 'text-blue-800' : 'text-red-600'}>
                          {isEntree ? '+' : '-'}{mov.quantity}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {mov.user}
                        </div>
                      </td>
                      <td className="p-4 text-slate-500 max-w-[150px] truncate">{mov.destination}</td>
                      <td className="p-4 pr-5 text-slate-400 whitespace-nowrap font-bold">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {mov.timestamp}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-400 font-bold">
              Aucun historique de mouvement pour ce produit.
            </div>
          )}
        </div>

      </section>

      {/* Large Floating Action Button for Exit registration */}
      {(role === 'administrateur' || role === 'pharmacien' || role === 'magasinier') && (
        <div className="flex justify-end pt-2">
          <button 
            onClick={() => setModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 active:scale-[0.95] text-white px-5 py-3 rounded-lg font-bold text-xs tracking-wider uppercase shadow-md transition-all flex items-center gap-2"
          >
            <span>Enregistrer une sortie</span>
          </button>
        </div>
      )}

      {/* Immediate exit registration dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 p-6 space-y-4">
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Sortie de Stock Immédiate</h3>
                <p className="text-xs text-slate-400 mt-0.5">Produit : {product.name}</p>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-base p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Quantité à déstocker (max: {product.stock})
                </label>
                <input 
                  type="number"
                  min="1"
                  max={product.stock}
                  required
                  value={modalQty}
                  onChange={(e) => setModalQty(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-red-600 outline-none text-sm text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Service de destination
                </label>
                <select 
                  value={modalDest}
                  onChange={(e) => setModalDest(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-red-600 outline-none text-sm text-slate-800 bg-white"
                >
                  <option value="Urgences">Urgences</option>
                  <option value="Bloc Opératoire A">Bloc Opératoire A</option>
                  <option value="Bloc Opératoire B">Bloc Opératoire B</option>
                  <option value="Réanimation">Réanimation</option>
                  <option value="Pédiatrie">Pédiatrie</option>
                </select>
              </div>

              {parseInt(modalQty, 10) > product.stock && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>La quantité demandée dépasse le stock actuel disponible !</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border border-slate-200 py-3 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={parseInt(modalQty, 10) > product.stock || parseInt(modalQty, 10) <= 0}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-red-700 transition-colors active:scale-[0.98] disabled:opacity-50"
                >
                  Valider Sortie
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
