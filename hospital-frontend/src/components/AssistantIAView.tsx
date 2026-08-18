import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  RotateCcw,
  RefreshCw,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { Product, Movement } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AssistantIAViewProps {
  products: Product[];
  movements: Movement[];
}

export default function AssistantIAView({ products, movements }: AssistantIAViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initial welcome message from the assistant
  useEffect(() => {
    const savedChat = localStorage.getItem('hospital_inventory_ai_chat');
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {
        loadDefaultGreetings();
      }
    } else {
      loadDefaultGreetings();
    }
  }, []);

  const loadDefaultGreetings = () => {
    const defaultGreetings: Message[] = [
      {
        id: 'msg-ini-1',
        role: 'assistant',
        content: `Bonjour ! Je suis **Stock Assistant IA**, votre pharmacien-logistique virtuel de l'Hôpital Central. 

Je suis directement branché sur l'inventaire en temps réel et votre historique de mouvements. Je peux vous aider à :
* Anticiper les **ruptures de stock** imminentes sous 7 jours.
* Suivre les **périodes de péremption proches** des vaccins et solutés.
* Calculer les **quantités réelles de réapprovisionnement** idéales en fonction de vos seuils de protection.
* Synthétiser rapidement l'historique des derniers mouvements logistiques.

Posez-moi votre question en langage naturel ou utilisez les suggestions rapides ci-dessous !`,
        timestamp: getFormattedTimeOnly()
      }
    ];
    setMessages(defaultGreetings);
  };

  // Sync back to local storage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('hospital_inventory_ai_chat', JSON.stringify(messages));
    }
  }, [messages]);

  // Handle scroll to bottom of chat pool
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const getFormattedTimeOnly = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: getFormattedTimeOnly()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);
    
    // Cycle beautiful loading messages for micro UX feedback
    const steps = [
      "Consultation de l'état actuel de votre stock...",
      "Extraction des seuils minimums de protection...",
      "Analyse prédictive de consommation via l'IA...",
      "Génération du rapport logistique adapté..."
    ];
    
    let currentStepIdx = 0;
    setLoadingStep(steps[currentStepIdx]);
    
    const loadingInterval = setInterval(() => {
      currentStepIdx = (currentStepIdx + 1) % steps.length;
      setLoadingStep(steps[currentStepIdx]);
    }, 1500);

    try {
      // Build payloads to push the actual state to the backend
      const conversationsPayload = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: conversationsPayload,
          products: products,
          movements: movements
        })
      });

      clearInterval(loadingInterval);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Problème de réponse réseau");
      }

      const data = await res.json();
      
      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply,
        timestamp: getFormattedTimeOnly()
      };

      setMessages(prev => [...prev, assistantMsg]);

    } catch (err: any) {
      clearInterval(loadingInterval);
      console.error(err);
      
      const errMsg: Message = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Oups ! Je n'ai pas pu joindre le serveur de prédiction.**

*Veuillez vérifier que votre clé d'API \`GEMINI_API_KEY\` est bien configurée dans le menu des secrets de l'application.* 

En attendant, voici une simulation de secours basée sur vos données : s'il s'agit des ruptures, les produits de santé prioritaires en quantité critique sont : **${products.filter(p => p.stock < p.minStock).map(p => p.name).join(', ') || 'aucun'}**.`,
        timestamp: getFormattedTimeOnly()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

      const handleClearChat = () => {
        setResetModalOpen(true);
      };

      const confirmClearChat = () => {
        localStorage.removeItem('hospital_inventory_ai_chat');
        loadDefaultGreetings();
        setResetModalOpen(false);
      };

  // Dynamic Suggestion lists matching the user's prompt
  const suggestions = [
    { label: "Risques de rupture à 7 jours", query: "Quel médicament ou produit risque d'être en rupture cette semaine selon les tendances prédites ?" },
    { label: "Alertes de péremption", query: "Quels produits de santé expirent bientôt et méritent attention ?" },
    { label: "Niveau de stock Paracétamol", query: "Combien de boîtes de Paracétamol ou antibiotiques restent en stock actuellement ?" },
    { label: "Dois-je recommander ?", query: "Dois-je lancer un réapprovisionnement ? Quels produits ont franchi leur seuil minimal de protection ?" }
  ];

  // Brief static metrics to display on the sidebar panel
  const criticallyLowProducts = products.filter(p => p.stock < p.minStock);
  const expiredOrSoon = products.filter(p => p.status === 'PÉREMPTION');

  return (
    <div className="space-y-6">
      
      {/* Title Header with elegant sparkles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 p-1.5 rounded-lg border border-blue-100 dark:border-blue-900/50">
              <Sparkles className="w-5 h-5 text-blue-700 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">Stock Assistant IA</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Assistant conversationnel intelligent spécialisé dans la logistique pharmaceutique et clinique.</p>
        </div>
        
        {/* Reset button */}
        <button
          onClick={handleClearChat}
          className="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors self-start sm:self-auto"
          title="Réinitialiser la conversation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Main Chat Panel */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col h-[600px] transition-colors">
          
          {/* Header of Chat */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between select-none shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 active:scale-95 h-8 bg-blue-800 text-white rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase leading-tight tracking-wider">Moteur d'Analyse IA</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] text-slate-400 font-bold">Connecté au stock direct</p>
                </div>
              </div>
            </div>
            <div className="text-[10px] uppercase font-black tracking-wider bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-900/50">
              Modèle: Gemini 3.5 Flash
            </div>
          </div>

          {/* Message Pool */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/20 dark:bg-slate-950/20">
            {messages.map((item) => {
              const isAI = item.role === 'assistant';
              return (
                <div key={item.id} className={`flex gap-3 max-w-[85%] ${isAI ? '' : 'ml-auto flex-row-reverse text-right'}`}>
                  
                  {/* Avatar Icons */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border select-none ${
                    isAI 
                      ? 'bg-blue-50 text-blue-800 border-blue-100' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}>
                    {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Bubble content */}
                  <div className="space-y-1">
                    <div className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                      isAI 
                        ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                        : 'bg-blue-800 text-white font-medium'
                    }`}>
                      {/* Very brief renderer helper to support Markdown bold lists cleanly */}
                      <p className="whitespace-pre-line text-left">
                        {item.content.split('\n').map((line, lIdx) => {
                          // Handle bold bullets
                          if (line.trim().startsWith('*')) {
                            const withoutAsterisk = line.replace(/^\s*\*\s*/, '');
                            return (
                              <span key={lIdx} className="block pl-3 relative mt-1 text-slate-700 dark:text-slate-300">
                                <span className="absolute left-0 top-[6px] w-1.5 h-1.5 bg-blue-700 rounded-full"></span>
                                {renderTextWithBold(withoutAsterisk)}
                              </span>
                            );
                          }
                          return <span key={lIdx} className="block">{renderTextWithBold(line)}</span>;
                        })}
                      </p>
                    </div>
                    <p className={`text-[9px] text-slate-400 tracking-wider ${isAI ? 'text-left pl-1' : 'text-right pr-1'}`}>
                      {item.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Simulated API calling/reasoning steps feedback */}
            {isLoading && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0 animate-spin">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="space-y-2">
                  <div className="bg-slate-100/85 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-500 dark:text-slate-400 italic flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-0"></span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-300"></span>
                    </div>
                    <span>{loadingStep || "Génération..."}</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick interactive shortcuts proposal panel chips */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 select-none">
              Questions suggérées ou prêtes à l'analyse :
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s.query)}
                  disabled={isLoading}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-900/50 p-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 rounded-lg transition-all text-left flex items-center justify-between gap-1.5 group select-none cursor-pointer"
                >
                  <span className="truncate max-w-[220px] md:max-w-none">{s.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-800 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Chat input form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputVal);
            }}
            className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 shrink-0"
          >
            <input
              type="text"
              required
              disabled={isLoading}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Posez une question sur l'état de l'inventaire clinique..."
              className="flex-grow p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-800 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-800 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !inputVal.trim()}
              className="bg-blue-800 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl w-11 h-11 flex items-center justify-center shadow-xs transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Sidebar IA State indicators sidecard */}
        <div className="space-y-4">
          
          {/* Card 1: Live Status indicators */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm font-sans space-y-4 select-none transition-colors">
            
            {/* Header */}
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Bot className="w-5 h-5 text-blue-800 dark:text-blue-300" />

              <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 tracking-wider">
                Indicateurs Clés du Stock
              </h3>
            </div>

            {/* Indicators */}
            <div className="grid grid-cols-1 gap-2.5">

              {/* Seuils franchis */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3">

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Seuils franchis
                  </p>

                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                    Produits sous le stock minimum
                  </p>
                </div>

                <div
                  className={`shrink-0 min-w-10 h-10 px-2 rounded-xl flex items-center justify-center text-sm font-black border ${
                    criticallyLowProducts.length > 0
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                  }`}
                >
                  {criticallyLowProducts.length}
                </div>

              </div>

              {/* Péremptions */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3">

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Péremptions proches
                  </p>

                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                    Produits nécessitant une surveillance
                  </p>
                </div>

                <div
                  className={`shrink-0 min-w-10 h-10 px-2 rounded-xl flex items-center justify-center text-sm font-black border ${
                    expiredOrSoon.length > 0
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {expiredOrSoon.length}
                </div>

              </div>

              {/* Références surveillées */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3">

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Références suivies
                  </p>

                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                    Produits analysés par le système
                  </p>
                </div>

                <div className="shrink-0 min-w-10 h-10 px-2 rounded-xl flex items-center justify-center text-sm font-black bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                  {products.length}
                </div>

              </div>

            </div>

            {/* Information IA */}
            <div className="bg-blue-50/70 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-100 dark:border-blue-900/50 flex gap-2.5 items-start text-[11px] text-blue-900 dark:text-blue-300 leading-normal">
              <ShieldCheck className="w-5 h-5 shrink-0 text-blue-800 dark:text-blue-300" />

              <p>
                Chaque mouvement enregistré modifie dynamiquement les analyses
                et les réponses logistiques fournies par l'IA.
              </p>
            </div>

          </section>

        </div>

      </div>

        {/* Why this AI assistant banner */}
        <section className="bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 transition-colors">

          <div className="flex flex-col md:flex-row md:items-center gap-3">

            <div className="flex items-center gap-2 shrink-0">

              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-blue-700 dark:text-blue-300" />
              </div>

              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide text-xs">
                Pourquoi ce Chat IA ?
              </h4>

            </div>

            <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-slate-700"></div>

            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Il permet d'obtenir un audit logistique instantané en langage naturel,
              sans devoir parcourir manuellement de longues tables d'inventaire
              hospitalières ou de rapports d'activité.
            </p>

          </div>

        </section>

      {/* Reset Conversation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-4">

          <div className="w-full max-w-md rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">

            <div className="flex items-start gap-4">

              {/* Icon */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40">
                <RotateCcw className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
              </div>

              <div className="flex-1">

                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Réinitialiser la conversation ?
                </h3>

                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Tout l'historique actuel de votre conversation avec Stock
                  Assistant IA sera effacé.
                </p>

                <div className="mt-3 rounded-lg border border-indigo-100 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 p-3">

                  <p className="text-xs font-medium leading-relaxed text-indigo-800 dark:text-indigo-300">
                    Une nouvelle conversation sera automatiquement démarrée
                    avec le message d'accueil de l'assistant.
                  </p>

                </div>

              </div>

            </div>

            <div className="mt-6 flex gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">

              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={confirmClearChat}
                className="flex-1 rounded-lg bg-indigo-700 hover:bg-indigo-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-[0.98]"
              >
                Réinitialiser
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// Simple text formatter to style markdown bold double asterisk **text** cleanly
function renderTextWithBold(text: string) {
  if (!text.includes('**')) {
    return text;
  }
  const parts = text.split('**');
  return parts.map((part, index) => {
    // Every odd index in parts represents text enclosed within **
      function renderTextWithBold(text: string) {
        if (!text.includes('**')) {
          return text;
        }

        const parts = text.split('**');

        return parts.map((part, index) => {
          if (index % 2 === 1) {
            return (
              <strong
                key={index}
                className="font-black text-slate-900 dark:text-slate-100"
              >
                {part}
              </strong>
            );
          }

          return part;
        });
      }
    return part;
  });
}
