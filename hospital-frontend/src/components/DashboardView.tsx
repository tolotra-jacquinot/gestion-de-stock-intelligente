import React from 'react';
import { AlertOctagon, CalendarRange, ArrowLeftRight, AlertTriangle, Sparkles, TrendingUp, Lock } from 'lucide-react';
import { Product, Movement, UserRole } from '../types';

interface DashboardViewProps {
  products: Product[];
  movements: Movement[];

  stats: {
    total_products: number;
    out_of_stock: number;
    critical_stock: number;
    expired: number;
    expiring_soon: number;

    recent_movements: {
      id: number;
      product: string;
      movement_type: string;
      quantity: number;
      user: string;
      created_at: string;
    }[];
  } | null;

  onSelectProduct: (productId: string) => void;
  role: UserRole;
  onNavigateToAssistant?: () => void;
}

export default function DashboardView({ products, movements, stats, onSelectProduct, role, onNavigateToAssistant }: DashboardViewProps) {

  const displayedOutOfStock = stats?.out_of_stock ?? 0;

  const displayedExpiry = stats?.expiring_soon ?? 0;

  const displayedMovements =
    stats?.recent_movements.length ?? 0;

  const displayedCritical =
    stats?.critical_stock ?? 0;

  const weeklyTrendData = [
    { day: 'LUN', height: '40%', value: 52 },
    { day: 'MAR', height: '60%', value: 78 },
    { day: 'MER', height: '85%', value: 110 },
    { day: 'JEU', height: '55%', value: 71 },
    { day: 'VEN', height: '90%', value: 117 },
    { day: 'SAM', height: '75%', value: 98 },
    { day: 'DIM', height: '100%', value: 130 },
  ];

  return (
    <div className="space-y-6">
      
      {/* Bento Block 1: Summary Statistics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Out of Stock Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Produits en rupture
            </p>
            <span className="text-red-600 bg-red-50 p-1.5 rounded-lg">
              <AlertOctagon className="w-5 h-5 stroke-[2]" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-red-600">{displayedOutOfStock}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">+2 depuis hier</p>
          </div>
        </div>

        {/* Near Expiry Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Expirations proches
            </p>
            <span className="text-amber-600 bg-amber-50 p-1.5 rounded-lg">
              <CalendarRange className="w-5 h-5 stroke-[2]" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-800">{displayedExpiry}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Sous 30 jours</p>
          </div>
        </div>

        {/* Movements count */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Mouvements du jour
            </p>
            <span className="text-blue-700 bg-blue-50 p-1.5 rounded-lg">
              <ArrowLeftRight className="w-5 h-5 stroke-[2]" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-800">{displayedMovements}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Entrées & Sorties</p>
          </div>
        </div>

      </section>

      {/* Critical Alerts & Consumption Chart */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Alerts Section */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-150 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Alertes Critiques
            </h2>
            <span className="bg-red-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {displayedCritical + displayedOutOfStock} PRIORITÉS
            </span>
          </div>
          
          <div className="divide-y divide-slate-100 flex-grow">
            
            {/* Alert 1 */}
            <div 
              onClick={() => onSelectProduct('prod-insu')}
              className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-slate-800">Insuline Glargine 100U</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Réserve centrale: 0 unités disponible</p>
              </div>
              <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                RUPTURE
              </span>
            </div>

            {/* Alert 2 */}
            <div 
              onClick={() => onSelectProduct('prod-amox')}
              className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-slate-800">Amoxicilline 500mg</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Seuil critique atteint (limite {products.find(p => p.id === 'prod-amox')?.minStock || 50}u)</p>
              </div>
              <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                RUPTURE
              </span>
            </div>

            {/* Alert 3 */}
            <div 
              onClick={() => onSelectProduct('prod-gants-nit')}
              className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-slate-800">Gants Nitrile (L)</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Délai réappro dépassement estimé</p>
              </div>
              <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                URGENT
              </span>
            </div>

          </div>
        </div>

        {/* Consumption Chart Visualizer */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-700" />
            Tendance de Consommation
          </h2>
          
          <div className="flex-grow flex items-end justify-between gap-2 h-44 mb-4 select-none">
            {weeklyTrendData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                
                {/* Tooltip on Hover */}
                <div className="absolute -top-10 scale-0 group-hover:scale-100 bg-slate-800 text-white text-[11px] font-bold px-2 py-1 rounded shadow-md transition-all duration-150 z-10 pointer-events-none whitespace-nowrap">
                  {data.value} unités
                </div>

                <div 
                  className="w-full bg-blue-100 hover:bg-blue-800 group-hover:bg-blue-800 rounded-t-sm transition-all duration-300"
                  style={{ height: data.height }}
                ></div>
                
              </div>
            ))}
          </div>
          
          <div className="flex justify-between text-[11px] text-slate-400 font-bold tracking-wider pt-2 border-t border-slate-100">
            {weeklyTrendData.map((data, index) => (
              <span key={index} className="w-full text-center">{data.day}</span>
            ))}
          </div>
        </div>

      </section>

      {/* IA Predictions: Risques à 7 jours */}
      {role === 'magasinier' ? (
        <section className="bg-slate-150 text-slate-600 p-5 rounded-2xl relative overflow-hidden border border-slate-200">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-slate-500" />
                <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
                  Prédictions IA : Verrouillé
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl">
                L'accès à l'intelligence artificielle prédictive de rupture de stock à 7 jours est réservé aux Pharmaciens et aux Directeurs de l'établissement hospitalier afin de réguler la chaîne de distribution médicale.
              </p>
            </div>
            <span className="text-[10px] uppercase font-black tracking-wider bg-slate-200 text-slate-650 px-2.5 py-1.5 rounded-lg border border-slate-300 pointer-events-none whitespace-nowrap self-start md:self-auto">
              Accès Limité
            </span>
          </div>
        </section>
      ) : (
        <section className="bg-blue-800/95 text-white p-5 rounded-2xl relative overflow-hidden shadow-md">
          <div className="relative z-10">
            
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-sky-200 animate-pulse" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Prédictions IA : Risques à 7 jours
              </h2>
            </div>
            
            <p className="text-xs text-sky-100 mb-6 font-medium leading-relaxed">
              Basé sur les tendances historiques et les interventions cliniques programmées.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Risk prediction 1 */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/15 transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-sky-200 uppercase font-black tracking-wider">Confiance 94%</span>
                  <span className="w-2.5 h-2.5 bg-sky-200 rounded-full animate-ping"></span>
                </div>
                <p className="text-sm font-bold mt-1 text-white">Paracétamol IV</p>
                <p className="text-xs mt-0.5 text-sky-100">Rupture estimée : J-3</p>
                
                <div className="w-full bg-white/20 h-1.5 mt-4 rounded-full overflow-hidden">
                  <div className="bg-sky-200 h-full w-[94%] rounded-full"></div>
                </div>
              </div>

              {/* Risk prediction 2 */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/15 transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-sky-200 uppercase font-black tracking-wider">Confiance 88%</span>
                </div>
                <p className="text-sm font-bold mt-1 text-white">Sérum Physiologique</p>
                <p className="text-xs mt-0.5 text-sky-100">Rupture estimée : J-5</p>
                
                <div className="w-full bg-white/20 h-1.5 mt-4 rounded-full overflow-hidden">
                  <div className="bg-sky-200 h-full w-[88%] rounded-full"></div>
                </div>
              </div>

              {/* Risk prediction 3 */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/15 transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-sky-200 uppercase font-black tracking-wider">Confiance 82%</span>
                </div>
                <p className="text-sm font-bold mt-1 text-white">Adrénaline 1mg</p>
                <p className="text-xs mt-0.5 text-sky-100">Rupture estimée : J-6</p>
                
                <div className="w-full bg-white/20 h-1.5 mt-4 rounded-full overflow-hidden">
                  <div className="bg-sky-200 h-full w-[82%] rounded-full"></div>
                </div>
              </div>

            </div>
          </div>

          {/* Elegant light background mesh decorative vector circles */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        </section>
      )}

      {/* Visual CTA banner to open Chat IA */}
      <section 
        onClick={onNavigateToAssistant}
        className="cursor-pointer bg-gradient-to-r from-blue-900 to-indigo-950 hover:from-blue-850 hover:to-indigo-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border border-blue-950/20 active:scale-[0.99] transition-all"
      >
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase text-white tracking-wider">
              Une question complexe sur le stock clinique ?
            </h3>
            <p className="text-xs text-blue-100 mt-1 leading-normal max-w-xl">
              Interrogez notre assistant pharmacologique virtuel "Stock Assistant IA" branché en temps réel sur les bases de données d'inventaire hospitalières.
            </p>
          </div>
        </div>
        <button className="bg-white text-blue-900 hover:bg-slate-50 transition-colors font-extrabold text-[11px] tracking-wider uppercase px-4.5 py-2.5 rounded-lg shrink-0 shadow-xs cursor-pointer">
          Ouvrir l'assistant
        </button>
      </section>

      {/* Visual Hero Banner representing the medical workspace */}
      <section className="w-full h-48 rounded-xl overflow-hidden relative shadow-xs">
        <img 
          alt="Laboratoire médical moderne" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover select-none" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAtTHXj9956YL4L_3BtRaEoDkyZPfmsItO3YnXVQLrGwj__Jt4eIsaHUqfkvcTNoF8DpwGMI4Bu_xkqBxyrzZgZvW_XGi8Tb5I3eDB101Hm1JiLxMTKh_yZ9tiuoV33FKNqzGx0ljh6gt1Uv-Q-V2HE8wFPF1-o7XRiI8aozC2GwQDQEo3geFWA9vPtWO-SzL-ZvGpxv1UuFEicDxkQNs80r7wz00KNpuJUtsR32z9TgHsDjpgFv3oiJliYjTYiHHTVbTArcXvug"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent flex items-end p-4">
          <p className="text-white text-xs font-semibold tracking-wider uppercase">
            Hôpital Central - Secteur Pharmacie A
          </p>
        </div>
      </section>

    </div>
  );
}
