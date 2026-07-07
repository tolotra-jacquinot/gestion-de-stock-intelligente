import React, { useState } from 'react';
import { Product, MovementType } from '../types';

interface QuickMovementModalProps {
  products: Product[];
  type: MovementType;
  onClose: () => void;
  onSave: (productId: string, quantity: number, type: MovementType, destination: string) => void;
}

export default function QuickMovementModal({ products, type, onClose, onSave }: QuickMovementModalProps) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [qty, setQty] = useState('10');
  const [destination, setDestination] = useState(type === 'Entrée' ? 'Fournisseur MedLab' : 'Urgences');

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedQty = parseInt(qty, 10);
    if (!selectedProductId || isNaN(parsedQty) || parsedQty <= 0) return;

    onSave(selectedProductId, parsedQty, type, destination);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 p-6 space-y-4">
        
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-lg text-slate-800">
              {type === 'Entrée' ? 'Enregistrer une entrée' : 'Enregistrer une sortie'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Enregistrement d'un movement de stock direct</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-extrabold text-base p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Select Product */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
              Sélectionner le produit
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800 bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category} | Stock: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            
            {/* Quantity */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Quantité
              </label>
              <input 
                type="number"
                min="1"
                max={type === 'Sortie' ? selectedProduct?.stock || 9999 : 99999}
                required
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800"
              />
            </div>

            {/* Destination / Source */}
            <div className="space-y-1.5 font-sans">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                {type === 'Entrée' ? 'Source / Fournisseur' : 'Service de Destination'}
              </label>
              {type === 'Entrée' ? (
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800 bg-white"
                >
                  <option value="Fournisseur MedLab">Fournisseur MedLab</option>
                  <option value="Logistique Centrale">Logistique Centrale</option>
                  <option value="Laboratoire BioPharma">Laboratoire BioPharma</option>
                  <option value="Don Exceptionnel">Don Exceptionnel</option>
                </select>
              ) : (
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800 bg-white"
                >
                  <option value="Urgences">Urgences</option>
                  <option value="Bloc Opératoire A">Bloc Opératoire A</option>
                  <option value="Bloc Opératoire B">Bloc Opératoire B</option>
                  <option value="Réanimation">Réanimation</option>
                  <option value="Pédiatrie">Pédiatrie</option>
                </select>
              )}
            </div>

          </div>

          {type === 'Sortie' && selectedProduct && parseLongStockCheck(selectedProduct, qty) && (
            <div className="text-xs text-red-650 bg-red-50 p-3 rounded-lg font-bold">
              La quantité demandée ({qty}) dépasse le stock actuel disponible ({selectedProduct.stock}) !
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 py-3 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={type === 'Sortie' && selectedProduct && parseLongStockCheck(selectedProduct, qty)}
              className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-colors active:scale-[0.98] disabled:opacity-50 ${
                type === 'Entrée' 
                  ? 'bg-blue-800 text-white hover:bg-blue-700' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Enregistrer
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

function parseLongStockCheck(prod: Product, val: string) {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed)) return true;
  return parsed > prod.stock;
}
