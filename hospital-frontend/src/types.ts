export type ProductCategory = 'Médicaments' | 'Dispositifs' | 'Solutés';

export type ProductStatus = 'CRITIQUE' | 'ATTENTION' | 'OK' | 'RUPTURE' | 'PÉREMPTION' | 'URGENT';

export interface Product {
  id: string;
  name: string;
  code: string;
  category: ProductCategory;
  status: ProductStatus;
  stock: number;
  minStock: number;
  maxStock: number;
  expiration: string;
  location: string;
  packaging: string;
  unitPrice: number;
  active: boolean;
}

export type MovementType = 'Entrée' | 'Sortie';

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  user: string;
  destination: string;
  timestamp: string;
  isEmergency?: boolean;
}

export type UserRole =
  | 'admin'
  | 'pharmacien'
  | 'magasinier'
  | 'directeur';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  roleName: string;
  role: UserRole;
  email: string;
  phone: string;
  employeeId: string;
  avatar: string;
}

export interface NotificationPrefs {
  ruptureAlerts: boolean;
  expirationAlerts: boolean;
}

export type RestockStatus =
  | 'PENDING'
  | 'ORDERED'
  | 'RECEIVED'
  | 'CANCELLED';

export interface RestockOrder {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  supplier: string;
  requestedBy: string;
  status: RestockStatus;
  createdAt: string;
  receivedAt?: string | null;
}

export type ActiveTab =
  | 'dashboard'
  | 'stock'
  | 'movements'
  | 'restocks'
  | 'sales'
  | 'profile'
  | 'product-details'
  | 'users'
  | 'assistant';
