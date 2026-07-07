import React, { useState } from 'react';
import { ProductCategory, Product } from '../types';

interface AddProductModalProps {
  onClose: () => void;
  onSave: (productData: {
    name: string;
    category: ProductCategory;
    stock: number;
    minStock: number;
    maxStock: number;
    expiration: string;
    packaging: string;
    unitPrice: number;
    location: string;
  }) => void;
}

export default function AddProductModal({ onClose, onSave }: AddProductModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Médicaments');
  const [stock, setStock] = useState('100');
  const [minStock, setMinStock] = useState('50');
  const [maxStock, setMaxStock] = useState('500');
  const [expiration, setExpiration] = useState('06/2026');
  const [packaging, setPackaging] = useState('Boite de 30');
  const [unitPrice, setUnitPrice] = useState('2.50');
  const [location, setLocation] = useState('Pharmacie Centrale - Tiroir G3');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    onSave({
      name,
      category,
      stock: parseInt(stock, 10) || 0,
      minStock: parseInt(minStock, 10) || 50,
      maxStock: parseInt(maxStock, 10) || 500,
      expiration,
      packaging,
      unitPrice: parseFloat(unitPrice) || 1.0,
      location
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Ajouter un produit</h3>
            <p className="text-xs text-slate-400 mt-0.5">Enregistrement d'une nouvelle fiche technique dans le stock</p>
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
          
          {/* Nom du produit */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
              Nom complet du produit
            </label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Paracétamol 500mg Gélule"
              className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            
            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800 bg-white"
              >
                <option value="Médicaments">Médicaments</option>
                <option value="Dispositifs">Dispositifs</option>
                <option value="Solutés">Solutés</option>
              </select>
            </div>

            {/* Packaging conditioning */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Conditionnement
              </label>
              <input 
                type="text" 
                required
                value={packaging}
                onChange={(e) => setPackaging(e.target.value)}
                placeholder="ex: Boite de 30"
                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800"
              />
            </div>

          </div>

          <div className="grid grid-cols-3 gap-3">
            
            {/* Initial stock */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Stock Initial
              </label>
              <input 
                type="number" 
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800"
              />
            </div>

            {/* Min stock threshold */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Seuil Min
              </label>
              <input 
                type="number" 
                required
                min="1"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800"
              />
            </div>

            {/* Max Stock */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Stock Max
              </label>
              <input 
                type="number" 
                required
                min="1"
                value={maxStock}
                onChange={(e) => setMaxStock(e.target.value)}
                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800"
              />
            </div>

          </div>

          <div className="grid grid-cols-2 gap-4">
            
            {/* Price */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Prix Unitaire (€)
              </label>
              <input 
                type="number" 
                step="0.01" 
                required
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800"
              />
            </div>

            {/* Expire date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Date d'expiration
              </label>
              <input 
                type="text" 
                required
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                placeholder="MM/AAAA ou Indéfini"
                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800"
              />
            </div>

          </div>

          {/* Location details */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
              Emplacement physique
            </label>
            <input 
              type="text" 
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="ex: Pharmacie Centrale - Rayon B1"
              className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-blue-800 outline-none text-sm text-slate-800"
            />
          </div>

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
              className="flex-1 bg-blue-800 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-blue-700 transition-colors active:scale-[0.98]"
            >
              Enregistrer
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
