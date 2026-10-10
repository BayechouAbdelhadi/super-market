import { AccountApp } from './types';

/**
 * Customer applications and portal services
 */
export const CUSTOMER_APPS: AccountApp[] = [
  {
    id: 'loyalty',
    title: 'Programme Fidélité',
    description: 'Suivez votre solde de points cumulés, vos remises disponibles et votre statut fidélité en temps réel.',
    href: '/account/loyalty',
    iconName: 'Sparkles',
    badge: 'Disponible',
    status: 'active',
    category: 'loyalty',
    accentColor: '#ff385c',
    order: 1,
  },
  {
    id: 'promotions',
    title: 'Promotions & Catalogues',
    description: 'Découvrez les arrivages hebdomadaires et réductions exclusives du magasin Super Market Calais.',
    href: '#promotions',
    iconName: 'Tag',
    badge: 'Bientôt disponible',
    status: 'coming_soon',
    category: 'offers',
    accentColor: '#f59e0b',
    order: 2,
  },
  {
    id: 'profile',
    title: 'Profil & Sécurité',
    description: 'Consultez vos coordonnées rattachées (téléphone, email) et gérez la sécurité de votre compte.',
    href: '#profile',
    iconName: 'UserCheck',
    badge: 'Configuré',
    status: 'active',
    category: 'account',
    accentColor: '#10b981',
    order: 3,
  },
];

export const ACCOUNT_APPS = CUSTOMER_APPS;

/**
 * Cashier portal applications and tools
 */
export const CASHIER_APPS: AccountApp[] = [
  {
    id: 'cashier-pos',
    title: 'Caisse & Points Fidélité',
    description: 'Recherche client au comptoir, attribution des points sur les achats et déduction des remises fidélité.',
    href: '/cashier/pos',
    iconName: 'Store',
    badge: 'Opérationnel',
    status: 'active',
    category: 'loyalty',
    accentColor: '#ff385c',
    order: 1,
  },
  {
    id: 'customers-dir',
    title: 'Annuaire des Clients',
    description: 'Consulter la liste des clients inscrits, créer des nouveaux comptes fidélité ou mettre à jour un numéro.',
    href: '/customers',
    iconName: 'Users',
    badge: 'Disponible',
    status: 'active',
    category: 'management',
    accentColor: '#10b981',
    order: 2,
  },
  {
    id: 'cashier-closing',
    title: 'Clôture de Caisse',
    description: 'Bilan des passages en caisse, récapitulatif des remises accordées et fermeture du poste de caisse.',
    href: '#closing',
    iconName: 'Clock',
    badge: 'Bientôt disponible',
    status: 'coming_soon',
    category: 'management',
    accentColor: '#6366f1',
    order: 3,
  },
];

/**
 * Admin portal applications and management modules
 */
export const ADMIN_APPS: AccountApp[] = [
  {
    id: 'admin-pos',
    title: 'Terminal Caisse Fidélité',
    description: 'Accéder directement au terminal de caisse pour enregistrer des achats ou attribuer des points.',
    href: '/cashier/pos',
    iconName: 'Store',
    badge: 'Opérationnel',
    status: 'active',
    category: 'loyalty',
    accentColor: '#ff385c',
    order: 1,
  },
  {
    id: 'admin-analytics',
    title: 'Analytics & Indicateurs Financiers',
    description: 'Chiffre d’affaires, volume des ventes, fréquentation en caisse et graphiques de performance du magasin.',
    href: '/admin/analytics',
    iconName: 'BarChart3',
    badge: 'En direct',
    status: 'active',
    category: 'analytics',
    accentColor: '#3b82f6',
    order: 2,
  },
  {
    id: 'admin-customers',
    title: 'Gestion des Clients',
    description: 'Base de données des clients fidélité, soldes de points, modification des coordonnées et historique.',
    href: '/customers',
    iconName: 'Users',
    badge: 'Base active',
    status: 'active',
    category: 'management',
    accentColor: '#10b981',
    order: 3,
  },
  {
    id: 'admin-cashiers',
    title: 'Gestion des Caissiers',
    description: 'Gestion des comptes du personnel de caisse, création avec invitations Brevo par email et contrôle des accès.',
    href: '/admin/cashiers',
    iconName: 'UserCog',
    badge: 'Équipe',
    status: 'active',
    category: 'management',
    accentColor: '#8b5cf6',
    order: 4,
  },
  {
    id: 'admin-live',
    title: 'Flux en Direct (Live Feed)',
    description: 'Monitoring en direct des événements, passages en caisse et opérations fidélité en temps réel.',
    href: '/admin/live',
    iconName: 'Activity',
    badge: 'Temps réel',
    status: 'active',
    category: 'analytics',
    accentColor: '#ec4899',
    order: 5,
  },
  {
    id: 'admin-inventory',
    title: 'Stocks & Inventaire',
    description: 'Suivi du catalogue d’articles, gestion des arrivages et seuils d’alerte pour réapprovisionnement.',
    href: '#inventory',
    iconName: 'Package',
    badge: 'Bientôt disponible',
    status: 'coming_soon',
    category: 'shopping',
    accentColor: '#f59e0b',
    order: 6,
  },
];

export function getActiveApps(role: 'CUSTOMER' | 'CASHIER' | 'ADMIN' = 'CUSTOMER'): AccountApp[] {
  const apps = role === 'ADMIN' ? ADMIN_APPS : role === 'CASHIER' ? CASHIER_APPS : CUSTOMER_APPS;
  return apps.filter((app) => app.status === 'active').sort((a, b) => a.order - b.order);
}

export function getAllApps(role: 'CUSTOMER' | 'CASHIER' | 'ADMIN' = 'CUSTOMER'): AccountApp[] {
  const apps = role === 'ADMIN' ? ADMIN_APPS : role === 'CASHIER' ? CASHIER_APPS : CUSTOMER_APPS;
  return [...apps].sort((a, b) => a.order - b.order);
}
