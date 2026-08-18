import axios from "axios";
import { Routes, Route } from "react-router-dom";
import ForgotPassword from "./components/ForgotPassword";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Search, Bell, Home, Package, ArrowLeftRight, User, ShieldAlert, Plus, Settings, Sparkles, Users, ShieldAlert as AlertIcon} from 'lucide-react';

import { Product, Movement, UserProfile, NotificationPrefs, ActiveTab, MovementType, UserAccount, UserRole } from './types';
import { apiFetch } from "./api";

import LoginView from './components/LoginView';
import ResetPassword from "./components/ResetPassword";
import DashboardView from './components/DashboardView';
import StockView from './components/StockView';
import MovementsView from './components/MovementsView';
import ProfilView from './components/ProfilView';
import ProductDetailsView from './components/ProductDetailsView';
import AddProductModal from './components/AddProductModal';
import QuickMovementModal from './components/QuickMovementModal';
import UsersManagementView from './components/UsersManagementView';
import AssistantIAView from './components/AssistantIAView';

// Status computer helper
function computeProductStatus(
  stock: number,
  minStock: number,
  expiration: string
): 'CRITIQUE' | 'ATTENTION' | 'OK' | 'PÉREMPTION' | 'RUPTURE' {
  if (stock === 0) return 'RUPTURE';

  if (
    expiration === 'PROCHE' ||
    expiration.toLowerCase() === 'proche' ||
    expiration === '12/2024'
  ) {
    return 'PÉREMPTION';
  }

  if (stock < minStock) return 'CRITIQUE';

  if (stock <= minStock * 1.5) return 'ATTENTION';

  return 'OK';
}

const mapApiProductToProduct = (apiProduct: any): Product => ({
  id: String(apiProduct.id),
  name: apiProduct.name,
  code: apiProduct.code,
  category: apiProduct.category,
  stock: apiProduct.stock,
  minStock: apiProduct.min_stock,
  maxStock: apiProduct.max_stock,
  expiration: apiProduct.expiration,
  location: apiProduct.location,
  packaging: apiProduct.packaging,
  unitPrice: Number(apiProduct.unit_price),
  active: apiProduct.active,
  status: computeProductStatus(
    apiProduct.stock,
    apiProduct.min_stock,
    apiProduct.expiration
  ),
});

const mapApiUserToUserAccount = (apiUser: any): UserAccount => ({
  id: String(apiUser.id),
  name: apiUser.username,
  email: apiUser.email || "",
  role: apiUser.role,
  createdAt: new Date(apiUser.date_joined).toLocaleDateString("fr-FR"),
});

const mapApiMovementToMovement = (
  apiMovement: any,
  products: Product[]
): Movement => {
  const product = products.find(
    (p) => p.id === String(apiMovement.product)
  );

  return {
    id: String(apiMovement.id),
    productId: String(apiMovement.product),
    productName: product?.name || `Produit #${apiMovement.product}`,
    type: apiMovement.movement_type === "ENTRY" ? "Entrée" : "Sortie",
    quantity: apiMovement.quantity,
    user: apiMovement.user_name || `Utilisateur #${apiMovement.user}`,
    destination: apiMovement.reason || "",
    timestamp: new Date(apiMovement.created_at).toLocaleString("fr-FR"),
  };
};

interface DashboardStats {
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
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  
  // Load products and movements state from localStorage or use initial mock data
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
  const fetchProducts = async () => {

    try {
      const response = await apiFetch(
        "http://127.0.0.1:8000/api/products/"
      );

      if (!response.ok) {
        throw new Error(`Erreur API : ${response.status}`);
      }

      const data = await response.json();

      const formattedProducts = data
        .filter((product: any) => product.active === true)
        .map(mapApiProductToProduct);

      setProducts(formattedProducts);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des produits :",
        error
      );
    }
  };

  fetchProducts();
}, [currentUser]);

  useEffect(() => {
  const fetchMovements = async () => {
    if (!currentUser || products.length === 0) {
      return;
    }

    try {
      const response = await apiFetch(
        "http://127.0.0.1:8000/api/movements/"
      );

      if (!response.ok) {
        throw new Error(`Erreur API : ${response.status}`);
      }

      const data = await response.json();

      const formattedMovements = data.map((movement: any) =>
        mapApiMovementToMovement(movement, products)
      );

      setMovements(formattedMovements);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des mouvements :",
        error
      );
    }
  };

  fetchMovements();
}, [currentUser, products]);

const [movements, setMovements] = useState<Movement[]>([]);

useEffect(() => {
  const fetchDashboardStats = async () => {
    if (!currentUser) {
      return;
    }

    try {
      const response = await apiFetch(
        "http://127.0.0.1:8000/api/dashboard/stats/"
      );

      if (!response.ok) {
        throw new Error(`Erreur API : ${response.status}`);
      }

      const data = await response.json();

      setDashboardStats(data);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des statistiques du dashboard :",
        error
      );
    }
  };

  fetchDashboardStats();
}, [currentUser, products, movements]);

  const [stockAlerts, setStockAlerts] = useState<any>(null);

  useEffect(() => {
    const fetchStockAlerts = async () => {
      if (!currentUser) {
        return;
      }

      try {
        const response = await apiFetch(
          "http://127.0.0.1:8000/api/alerts/"
        );

        if (!response.ok) {
          throw new Error(`Erreur API : ${response.status}`);
        }

        const data = await response.json();

        setStockAlerts(data);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des alertes de stock :",
          error
        );
      }
    };

    fetchStockAlerts();
  }, [currentUser, products, movements]);

  const [users, setUsers] = useState<UserAccount[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser || currentUser.role !== "admin") {
        return;
      }

      try {
        const response = await apiFetch(
          "http://127.0.0.1:8000/api/auth/users/"
        );

        if (!response.ok) {
          throw new Error(`Erreur API : ${response.status}`);
        }

        const data = await response.json();

        setUsers(
          data.map(mapApiUserToUserAccount)
        );
      } catch (error) {
        console.error(
          "Erreur lors du chargement des utilisateurs :",
          error
        );
      }
    };

    fetchUsers();
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    ruptureAlerts: true,
    expirationAlerts: true
  });

  // Modal open states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [quickMoveType, setQuickMoveType] = useState<MovementType | null>(null);

  // Helper date
  const getFormattedDateShort = () => {
    const d = new Date();
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const handleAddUser = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<boolean> => {
    try {
      const response = await apiFetch(
        "http://127.0.0.1:8000/api/auth/users/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: name,
            email,
            password,
            role,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        console.error(
          "Erreur création utilisateur :",
          errorData
        );

        return false;
      }

      const createdUser = await response.json();

      setUsers((prev) => [
        ...prev,
        mapApiUserToUserAccount(createdUser),
      ]);

      return true;
    } catch (error) {
      console.error(
        "Erreur lors de la création de l'utilisateur :",
        error
      );

      return false;
    }
  };

  const handleUpdateUserRole = async (
    id: string,
    role: UserRole
  ): Promise<boolean> => {
    try {
      const response = await apiFetch(
        `http://127.0.0.1:8000/api/auth/users/${id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        console.error(
          "Erreur modification rôle utilisateur :",
          errorData
        );

        return false;
      }

      const updatedUser = await response.json();

      setUsers((prev) =>
        prev.map((user) =>
          user.id === id
            ? mapApiUserToUserAccount(updatedUser)
            : user
        )
      );

      return true;
    } catch (error) {
      console.error(
        "Erreur lors de la modification du rôle :",
        error
      );

      return false;
    }
  };

  const handleDeleteUser = async (
    id: string
  ): Promise<boolean> => {
    try {
      const response = await apiFetch(
        `http://127.0.0.1:8000/api/auth/users/${id}/`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        let errorData = null;

        try {
          errorData = await response.json();
        } catch {
          // DELETE 204 n'a pas de body
        }

        console.error(
          "Erreur suppression utilisateur :",
          errorData
        );

        return false;
      }

      setUsers((prev) =>
        prev.filter((user) => user.id !== id)
      );

      return true;
    } catch (error) {
      console.error(
        "Erreur lors de la suppression de l'utilisateur :",
        error
      );

      return false;
    }
  };

  // Handle Login success
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Helper helper to format current date/time
  const getFormattedDateTime = () => {
    const d = new Date();
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month}, ${hours}:${minutes}`;
  };

  // Action: Approve Order recommendation
  const handleApproveOrder = (productId: string, quantity: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newStock = p.stock + quantity;
        const newStatus = computeProductStatus(newStock, p.minStock, p.expiration);
        return {
          ...p,
          stock: newStock,
          status: newStatus
        };
      }
      return p;
    }));

    const prod = products.find(p => p.id === productId);
    if (prod) {
      const isEmergency = prod.status === 'CRITIQUE' || prod.status === 'RUPTURE';
      const newMove: Movement = {
        id: `mov-${Date.now()}`,
        productId: productId,
        productName: prod.name,
        type: 'Entrée',
        quantity: quantity,
        user: 'Dr. Martin',
        destination: 'Fournisseur MedLab',
        timestamp: getFormattedDateTime(),
        isEmergency
      };
      setMovements(prev => [newMove, ...prev]);
    }
  };

  // Action: Register movement (Entrée or Sortie)
// Action: Register movement through Django API
const handleRegisterMove = async (
  productId: string,
  quantity: number,
  type: MovementType,
  destination: string
) => {
  try {
    const response = await apiFetch(
      "http://127.0.0.1:8000/api/movements/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: Number(productId),
          movement_type: type === "Entrée" ? "ENTRY" : "EXIT",
          quantity,
          reason: destination,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        "Erreur création mouvement :",
        errorData
      );
      return;
    }

    const createdMovement = await response.json();

    setMovements((prev) => [
      mapApiMovementToMovement(createdMovement, products),
      ...prev,
    ]);

    // Recharger les produits pour récupérer le nouveau stock calculé par Django
    const productsResponse = await apiFetch(
      "http://127.0.0.1:8000/api/products/"
    );

    if (productsResponse.ok) {
      const productsData = await productsResponse.json();

      setProducts(
        productsData.map(mapApiProductToProduct)
      );
    }

    setQuickMoveType(null);
  } catch (error) {
    console.error(
      "Erreur lors de l'enregistrement du mouvement :",
      error
    );
  }
};
// Action: Save product through Django API
const handleSaveProduct = async (data: {
  name: string;
  category: any;
  stock: number;
  minStock: number;
  maxStock: number;
  expiration: string;
  packaging: string;
  unitPrice: number;
  location: string;
}) => {

  const codePrefixes: Record<string, string> = {
    Médicaments: "MED",
    Dispositifs: "DSP",
    Solutés: "SLT",
  };

  const prefix = codePrefixes[data.category] || "PRD";
  const randomNum = Math.floor(100 + Math.random() * 900);
  const code = `${prefix}-${randomNum}-CP`;

  try {
    const response = await apiFetch(
      "http://127.0.0.1:8000/api/products/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          code: code,
          category: data.category,
          stock: data.stock,
          min_stock: data.minStock,
          max_stock: data.maxStock,
          expiration: data.expiration,
          location: data.location,
          packaging: data.packaging,
          unit_price: data.unitPrice,
          supplier: "",
          active: true,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur création produit :", errorData);
      return;
    }

    const createdProduct = await response.json();

    setProducts((prev) => [
      mapApiProductToProduct(createdProduct),
      ...prev,
    ]);

    setIsAddOpen(false);
  } catch (error) {
    console.error(
      "Erreur lors de la création du produit :",
      error
    );
  }
};

  const handleChangePassword = async (oldPass: string, newPass: string) => {
    // Simulating password modification check
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  };

  const handleUpdateProduct = async (
    productId: string,
    data: {
      name: string;
      category: any;
      minStock: number;
      maxStock: number;
      expiration: string;
      packaging: string;
      unitPrice: number;
      location: string;
    }
  ): Promise<boolean> => {
    try {
      const response = await apiFetch(
        `http://127.0.0.1:8000/api/products/${productId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name,
            category: data.category,
            min_stock: data.minStock,
            max_stock: data.maxStock,
            expiration: data.expiration,
            packaging: data.packaging,
            unit_price: data.unitPrice,
            location: data.location,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        console.error(
          "Erreur modification produit :",
          errorData
        );

        return false;
      }

      const updatedProduct = await response.json();

      const formattedProduct =
        mapApiProductToProduct(updatedProduct);

      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? formattedProduct
            : product
        )
      );

      return true;
    } catch (error) {
      console.error(
        "Erreur lors de la modification du produit :",
        error
      );

      return false;
    }
  };

  const handleArchiveProduct = async (
    productId: string
  ): Promise<boolean> => {
    try {
      const response = await apiFetch(
        `http://127.0.0.1:8000/api/products/${productId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            active: false,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        console.error(
          "Erreur archivage produit :",
          errorData
        );

        return false;
      }

      setProducts((prev) =>
        prev.filter((product) => product.id !== productId)
      );

      setSelectedProductId(null);
      setActiveTab("stock");

      return true;
    } catch (error) {
      console.error(
        "Erreur lors de l'archivage du produit :",
        error
      );

      return false;
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setActiveTab('product-details');
  };

  const handleSelectProductByName = (productName: string) => {
    const prod = products.find(p => p.name.toLowerCase() === productName.toLowerCase() || productName.toLowerCase().includes(p.name.toLowerCase()));
    if (prod) {
      setSelectedProductId(prod.id);
      setActiveTab('product-details');
    } else {
      setActiveTab('stock');
    }
  };

  // Login guard redirect if session has not started yet
  if (!currentUser) {
  return (
    <Routes>

      <Route
        path="/"
        element={
          <LoginView
            onLoginSuccess={handleLoginSuccess}
          />
        }
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />
      <Route
        path="/reset-password/:uidb64/:token"
        element={<ResetPassword />}
      />

    </Routes>
  );
}

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedProductMovements = movements.filter(m => m.productId === selectedProductId);

  return (
    <div className="min-h-screen text-slate-800 flex flex-col md:flex-row bg-slate-50">
      
      {/* Dynamic Top Navigation Header */}
      <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-white border-b border-slate-200 flex justify-between items-center px-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <Activity className="w-6 h-6 text-blue-800" />
          <h1 className="text-lg font-extrabold text-blue-900 tracking-tight">SALFA Ejeda</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setActiveTab('stock')}
            className="p-1.5 hover:bg-slate-150 rounded-full transition-colors text-slate-500"
          >
            <Search className="w-5 h-5" />
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('profile')}
            className="p-1.5 hover:bg-slate-150 relative rounded-full transition-colors text-slate-500"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full"></span>
          </button>
        </div>
      </header>

      {/* Desktop Responsive Sidebar Rail Container */}
      <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200 flex-col p-4 z-30">
        <div className="space-y-1.5 flex-grow font-sans">
          
          {/* Dashboard Tab */}
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-blue-800 text-white shadow-xs' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2]" />
            <span>Dashboard</span>
          </button>

          {/* Inventaire / Stock Tab */}
          <button 
            onClick={() => setActiveTab('stock')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'stock' || activeTab === 'product-details'
                ? 'bg-blue-800 text-white shadow-xs' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Package className="w-5 h-5 stroke-[2]" />
            <span>Inventaire Stock</span>
          </button>

          {/* Mouvements timeline Tab */}
          <button 
            onClick={() => setActiveTab('movements')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'movements'
                ? 'bg-blue-800 text-white shadow-xs' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5 stroke-[2]" />
            <span>Historique</span>
          </button>

          {/* Assistant IA Tab */}
          <button 
            onClick={() => setActiveTab('assistant')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'assistant'
                ? 'bg-blue-800 text-white shadow-xs' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-5 h-5 stroke-[2] text-amber-500" />
            <span>Assistant IA</span>
          </button>

          {/* Profil Tab */}
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-blue-800 text-white shadow-xs' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <User className="w-5 h-5 stroke-[2]" />
            <span>Profil</span>
          </button>

          {/* Admin Utilisateurs Tab */}
          {currentUser.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-blue-800 text-white shadow-xs' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Users className="w-5 h-5 stroke-[2]" />
              <span>Utilisateurs</span>
            </button>
          )}

        </div>

        {/* Workspace certified indicators footer inside the sidebar */}
        <div className="pt-4 border-t border-slate-100 font-sans space-y-3.5">
          <div className="flex items-center gap-3 p-2 bg-blue-50 text-blue-800 rounded-lg">
            <User className="w-5 h-5" />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate text-blue-900 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-blue-700 tracking-wider font-semibold uppercase mt-0.5">{currentUser.roleName}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full h-10 border border-slate-200 hover:bg-red-50 hover:text-red-650 hover:border-red-100 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Core Router Workspace Panel */}
      <main className="flex-grow pt-24 pb-28 md:pb-12 md:pl-70 px-4 max-w-6xl mx-auto w-full">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            
            {activeTab === 'dashboard' && (
              <DashboardView 
                products={products} 
                movements={movements} 
                stats={dashboardStats}
                alerts={stockAlerts}
                onSelectProduct={handleSelectProduct} 
                role={currentUser.role}
                onNavigateToAssistant={() => setActiveTab('assistant')}
              />
            )}

            {activeTab === 'stock' && (
              <StockView 
                products={products} 
                onSelectProduct={handleSelectProduct}
                onAddProduct={() => setIsAddOpen(true)}
                role={currentUser.role}
              />
            )}

            {activeTab === 'movements' && (
              <MovementsView 
                movements={movements} 
                onSelectProductByName={handleSelectProductByName}
                onOpenQuickMovement={(type) => setQuickMoveType(type)}
                role={currentUser.role}
              />
            )}

            {activeTab === 'assistant' && (
              <AssistantIAView 
                products={products}
                movements={movements}
              />
            )}

            {activeTab === 'profile' && (
              <ProfilView 
                user={currentUser} 
                prefs={notificationPrefs} 
                onUpdatePrefs={setNotificationPrefs}
                onLogout={handleLogout}
                onChangePassword={handleChangePassword}
              />
            )}

            {activeTab === 'users' && currentUser.role === 'admin' && (
              <UsersManagementView
                users={users}
                onAddUser={handleAddUser}
                onUpdateUserRole={handleUpdateUserRole}
                onDeleteUser={handleDeleteUser}
              />
            )}

            {activeTab === 'product-details' && selectedProduct && (
              <ProductDetailsView 
                product={selectedProduct} 
                productMovements={selectedProductMovements}
                onBack={() => setActiveTab('stock')}
                onApproveOrder={handleApproveOrder}
                onRegisterMove={handleRegisterMove}
                onUpdateProduct={handleUpdateProduct}
                onArchiveProduct={handleArchiveProduct}
                role={currentUser.role}
              />
            )}

          </motion.div>
        </AnimatePresence>

      </main>

      {/* Mobile Responsive Persistent Safe Area Bottom Bar Header */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex justify-around items-center z-40 pb-safe shadow-md select-none">
        
        {/* Dashboard Tab */}
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center w-16 transition-all ${
            activeTab === 'dashboard' 
              ? 'text-blue-800 font-extrabold scale-105' 
              : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <Home className="w-5 h-5 text-current stroke-[2]" />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight uppercase">Dashboard</span>
        </button>

        {/* Inventory Tab */}
        <button 
          onClick={() => setActiveTab('stock')}
          className={`flex flex-col items-center justify-center w-16 transition-all ${
            activeTab === 'stock' || activeTab === 'product-details'
              ? 'text-blue-800 font-extrabold scale-105' 
              : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <Package className="w-5 h-5 text-current stroke-[2]" />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight uppercase">Stock</span>
        </button>

        {/* Movements Tab */}
        <button 
          onClick={() => setActiveTab('movements')}
          className={`flex flex-col items-center justify-center w-18 transition-all ${
            activeTab === 'movements' 
              ? 'text-blue-800 font-extrabold scale-105' 
              : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5 text-current stroke-[2]" />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight uppercase">Mouvements</span>
        </button>

        {/* Assistant Tab */}
        <button 
          onClick={() => setActiveTab('assistant')}
          className={`flex flex-col items-center justify-center w-16 transition-all ${
            activeTab === 'assistant' 
              ? 'text-blue-800 font-extrabold scale-105' 
              : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <Sparkles className="w-5 h-5 text-amber-500 stroke-[2]" />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight uppercase">Assistant IA</span>
        </button>

        {/* Profile Tab */}
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center w-16 transition-all ${
            activeTab === 'profile' 
              ? 'text-blue-800 font-extrabold scale-105' 
              : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <User className="w-5 h-5 text-current stroke-[2]" />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight uppercase">Profil</span>
        </button>

        {/* Admin Users Tab (Mobile) */}
        {currentUser.role === 'administrateur' && (
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex flex-col items-center justify-center w-16 transition-all ${
              activeTab === 'users' 
                ? 'text-blue-800 font-extrabold scale-105' 
                : 'text-slate-400 hover:text-slate-650'
            }`}
          >
            <Users className="w-5 h-5 text-current stroke-[2]" />
            <span className="text-[10px] font-bold mt-0.5 tracking-tight uppercase">Utilisateurs</span>
          </button>
        )}

      </nav>

      {/* Global Modals overlay wrapper container */}
      {isAddOpen && (
        <AddProductModal 
          onClose={() => setIsAddOpen(false)}
          onSave={handleSaveProduct}
        />
      )}

      {quickMoveType && (
        <QuickMovementModal 
          products={products}
          type={quickMoveType}
          onClose={() => setQuickMoveType(null)}
          onSave={handleRegisterMove}
        />
      )}

    </div>
  );
}


