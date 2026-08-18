import React, { useState } from 'react';
import { Product, MovementType } from '../types';

interface QuickMovementModalProps {
  products: Product[];
  type: MovementType;
  onClose: () => void;
  onSave: (
    productId: string,
    quantity: number,
    type: MovementType,
    destination: string
  ) => Promise<void>;
}

export default function QuickMovementModal({ products, type, onClose, onSave }: QuickMovementModalProps) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [qty, setQty] = useState('10');
  const [destination, setDestination] = useState(type === 'Entrée' ? 'Fournisseur MedLab' : 'Urgences');

  const [isSaving, setIsSaving] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedQty = parseInt(qty, 10);

    if (
      !selectedProductId ||
      isNaN(parsedQty) ||
      parsedQty <= 0 ||
      isSaving
    ) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave(
        selectedProductId,
        parsedQty,
        type,
        destination
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full border border-slate-100 dark:border-slate-800 p-6 space-y-4 transition-colors">
        
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
              {type === 'Entrée' ? 'Enregistrer une entrée' : 'Enregistrer une sortie'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Enregistrement d'un mouvement de stock direct</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 font-extrabold text-base p-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Select Product */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Sélectionner le produit
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
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
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Quantité
              </label>
              <input 
                type="number"
                min="1"
                max={type === 'Sortie' ? selectedProduct?.stock || 9999 : 99999}
                required
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Destination / Source */}
            <div className="space-y-1.5 font-sans">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {type === 'Entrée' ? 'Source / Fournisseur' : 'Service de Destination'}
              </label>
              {type === 'Entrée' ? (
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
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
                  className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
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
            <div className="text-xs text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 p-3 rounded-lg font-bold">
              La quantité demandée ({qty}) dépasse le stock actuel disponible ({selectedProduct.stock}) !
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 border border-slate-200 dark:border-slate-700 py-3 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={
                isSaving ||
                (
                  type === 'Sortie' &&
                  !!selectedProduct &&
                  parseLongStockCheck(selectedProduct, qty)
                )
              }
              className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                type === 'Entrée'
                  ? 'bg-blue-800 text-white hover:bg-blue-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Enregistrement...
                </span>
              ) : (
                "Enregistrer"
              )}
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
