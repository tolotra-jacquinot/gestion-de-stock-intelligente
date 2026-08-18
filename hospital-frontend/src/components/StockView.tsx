import React, { useState } from 'react';
import { Search, AlertTriangle, AlertCircle, CheckCircle, HelpCircle, Archive } from 'lucide-react';
import { Product, ProductCategory, ProductStatus, UserRole } from '../types';

interface StockViewProps {
  products: Product[];
  onSelectProduct: (productId: string) => void;
  onAddProduct: () => void;
  role: UserRole;
}

export default function StockView({ products, onSelectProduct, onAddProduct, role }: StockViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Tout');
  const [showArchivesInfo, setShowArchivesInfo] = useState(false);

  const categories: string[] = ['Tout', 'Médicaments', 'Dispositifs', 'Solutés'];

  // Filter products by category and search filter
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'Tout' || product.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const getStatusStyle = (status: ProductStatus) => {
    switch (status) {
      case 'CRITIQUE':
      case 'RUPTURE':
        return {
          border: 'border-l-4 border-l-red-600',
          badge: 'bg-red-600 text-white',
          stockText: 'text-red-600',
          badgeText: 'Critique'
        };
      case 'URGENT':
        return {
          border: 'border-l-4 border-l-red-600',
          badge: 'bg-red-600 text-white',
          stockText: 'text-red-600',
          badgeText: 'Urgent'
        };
      case 'ATTENTION':
        return {
          border: 'border-l-4 border-l-amber-500',
          badge: 'bg-amber-500 text-white',
          stockText: 'text-amber-600',
          badgeText: 'Attention'
        };
      case 'PÉREMPTION':
        return {
          border: 'border-l-4 border-l-red-600',
          badge: 'bg-red-100 text-red-700',
          stockText: 'text-slate-800',
          badgeText: 'Péremption'
        };
      case 'OK':
      default:
        return {
          border: 'border-l-4 border-l-blue-800',
          badge: 'bg-blue-800 text-white',
          stockText: 'text-blue-800',
          badgeText: 'OK'
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search Bar & Category Chips */}
      <div className="space-y-4">
        
        {/* Input field */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5 transition-colors group-focus-within:text-blue-700" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all shadow-xs"
          />
        </div>

        {/* Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                activeCategory === cat 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Grid of Product Cards */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const style = getStatusStyle(product.status);
            return (
              <div 
                key={product.id}
                onClick={() => onSelectProduct(product.id)}
                className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-all hover:translate-y-[-2px] hover:shadow-md dark:hover:bg-slate-800/70 cursor-pointer flex flex-col justify-between ${style.border}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        {product.category}
                      </p>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight mt-0.5">
                        {product.name}
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest leading-normal ${style.badge}`}>
                      {style.badgeText}
                    </span>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-6 pt-3 border-t border-slate-50 dark:border-slate-800">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      STOCK ACTUEL
                    </p>
                    <p className={`text-base font-extrabold mt-1 ${style.stockText}`}>
                      {product.stock}{' '}
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        / {product.minStock} min
                      </span>
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      EXPIRATION
                    </p>
                    <p className={`text-[12px] font-bold mt-1 ${product.status === 'PÉREMPTION' || product.expiration === 'PROCHE' ? 'text-red-600 font-extrabold' : 'text-slate-600 dark:text-slate-300'}`}>
                      {product.expiration}
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-xs">
          <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Aucun produit trouvé</p>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">Essayez d'ajuster vos critères de recherche ou filtres.</p>
        </div>
      )}

      {/* Persistent Floating Action Button in the bottom corner of view */}
      {(role === 'admin' || role === 'magasinier') && (
        <div className="flex justify-end gap-3 pt-4">

          <button
            type="button"
            onClick={() => setShowArchivesInfo(true)}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.95] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-5 py-3 rounded-lg font-bold text-xs tracking-wider uppercase shadow-xs transition-all flex items-center gap-2"
          >
            <Archive className="w-4 h-4" />
            <span>Archives</span>
          </button>

          <button 
            onClick={onAddProduct}
            className="bg-blue-800 hover:bg-blue-700 active:scale-[0.95] text-white px-5 py-3 rounded-lg font-bold text-xs tracking-wider uppercase shadow-md transition-all flex items-center gap-2"
          >
            <span>Ajouter un produit</span>
          </button>

        </div>
      )}

      {/* Archives Info Modal */}
      {showArchivesInfo && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">

          <div className="w-full max-w-md rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <Archive className="h-5 w-5 text-blue-800" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Archives des produits
                </h3>

                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Module en cours de développement.
                </p>

                <div className="mt-3 rounded-lg border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-3">
                  <p className="text-xs font-medium leading-relaxed text-blue-800 dark:text-blue-300">
                    La consultation et la restauration des produits archivés
                    seront prochainement disponibles.
                  </p>
                </div>
              </div>

            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setShowArchivesInfo(false)}
                className="rounded-lg bg-blue-800 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-blue-700"
              >
                Compris
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
