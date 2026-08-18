import { Product, Movement } from './types';

export const initialProducts: Product[] = [
  {
    id: 'prod-amox',
    name: 'Amoxicilline 500mg',
    code: 'AMX-500-CP',
    category: 'Médicaments',
    status: 'CRITIQUE',
    stock: 12,
    minStock: 50,
    maxStock: 250,
    expiration: '12/2024',
    location: 'Pharmacie Centrale - Rayon B12 - Étagère 3',
    packaging: 'Boite de 16',
    unitPrice: 4.50,
    active: true
  },
  {
    id: 'prod-gants-ster',
    name: 'Gants Stériles T7.5',
    code: 'GNT-75-ST',
    category: 'Dispositifs',
    status: 'ATTENTION',
    stock: 85,
    minStock: 100,
    maxStock: 500,
    expiration: '06/2026',
    location: 'Secteur Chirurgie - Étagère D1',
    packaging: 'Boite de 50',
    unitPrice: 1.20,
    active: true
  },
  {
    id: 'prod-nacl',
    name: 'NaCl 0.9% 500ml',
    code: 'SPO-SAL-50',
    category: 'Solutés',
    status: 'OK',
    stock: 420,
    minStock: 200,
    maxStock: 1000,
    expiration: '01/2025',
    location: 'Pavillon Fluides - Salle de Stockage C',
    packaging: 'Poche de 500ml',
    unitPrice: 0.85,
    active: true
  },
  {
    id: 'prod-para-iv',
    name: 'Paracétamol 1g IV',
    code: 'PAR-1G-IV',
    category: 'Médicaments',
    status: 'OK',
    stock: 150,
    minStock: 80,
    maxStock: 500,
    expiration: '09/2025',
    location: 'Pharmacie Centrale - Tiroir A4',
    packaging: 'Flacon injectable',
    unitPrice: 2.10,
    active: true
  },
  {
    id: 'prod-adre',
    name: 'Adrénaline 1mg',
    code: 'ADR-1MG-AMP',
    category: 'Médicaments',
    status: 'PÉREMPTION',
    stock: 30,
    minStock: 20,
    maxStock: 100,
    expiration: 'PROCHE',
    location: 'Pharmacie Centrale - Armoire Froide Securisée F2 prime',
    packaging: 'Ampoule de 1ml',
    unitPrice: 3.40,
    active: true
  },
  {
    id: 'prod-serin',
    name: 'Seringues 10ml',
    code: 'SER-10ML-US',
    category: 'Dispositifs',
    status: 'OK',
    stock: 1200,
    minStock: 500,
    maxStock: 2500,
    expiration: 'Indéfini',
    location: 'Stock Général - Allée H',
    packaging: 'Boite de 100',
    unitPrice: 0.15,
    active: true
  },
  {
    id: 'prod-insu',
    name: 'Insuline Glargine 100U',
    code: 'INS-GL-100',
    category: 'Médicaments',
    status: 'RUPTURE',
    stock: 0,
    minStock: 30,
    maxStock: 150,
    expiration: '08/2026',
    location: 'Pharmacie Centrale - Réfrigérateur Principal',
    packaging: 'Stylo prérempli',
    unitPrice: 15.60,
    active: true
  },
  {
    id: 'prod-gants-nit',
    name: 'Gants Nitrile (L)',
    code: 'GNT-NIT-L',
    category: 'Dispositifs',
    status: 'URGENT',
    stock: 15,
    minStock: 150,
    maxStock: 800,
    expiration: '11/2026',
    location: 'Stock Consommables - Allée B',
    packaging: 'Boite de 100',
    unitPrice: 0.95,
    active: true
  }
];

export const initialMovements: Movement[] = [
  {
    id: 'mov-1',
    productId: 'prod-amox',
    productName: 'Amoxicilline 500mg',
    type: 'Entrée',
    quantity: 50,
    user: 'Dr. Martin',
    destination: 'Fournisseur MedLab',
    timestamp: "Aujourd'hui, 09:45"
  },
  {
    id: 'mov-2',
    productId: 'prod-para-iv',
    productName: 'Paracétamol Injectable',
    type: 'Sortie',
    quantity: 12,
    user: 'Inf. Julie L.',
    destination: 'Urgences',
    timestamp: "Aujourd'hui, 08:30"
  },
  {
    id: 'mov-3',
    productId: 'prod-gants-ster',
    productName: 'Gants Chirurgicaux T7.5',
    type: 'Entrée',
    quantity: 200,
    user: 'Logistique Central',
    destination: 'Fournisseur MedLab',
    timestamp: 'Hier, 16:20'
  },
  {
    id: 'mov-4',
    productId: 'prod-insu',
    productName: 'Insuline Glargine',
    type: 'Sortie',
    quantity: 5,
    user: 'Dr. Martin',
    destination: 'Bloc Opératoire A',
    timestamp: 'Hier, 14:05'
  },
  {
    id: 'mov-5',
    productId: 'prod-gants-nit',
    productName: 'Masques FFP2',
    type: 'Sortie',
    quantity: 50,
    user: 'Inf. Thomas K.',
    destination: 'Bloc Opératoire B',
    timestamp: 'Hier, 11:30'
  },
  {
    id: 'mov-6',
    productId: 'prod-amox',
    productName: 'Amoxicilline 500mg',
    type: 'Sortie',
    quantity: 24,
    user: 'Inf. Durand',
    destination: 'Bloc Opératoire A',
    timestamp: '14 Mai, 10:45'
  },
  {
    id: 'mov-7',
    productId: 'prod-para-iv',
    productName: 'Paracétamol Injectable',
    type: 'Entrée',
    quantity: 100,
    user: 'Dr. Martin',
    destination: 'Fournisseur MedLab',
    timestamp: '13 Mai, 16:20'
  },
  {
    id: 'mov-8',
    productId: 'prod-para-iv',
    productName: 'Paracétamol Injectable',
    type: 'Sortie',
    quantity: 10,
    user: 'Inf. Petit',
    destination: 'Urgences',
    timestamp: '13 Mai, 09:12'
  }
];
