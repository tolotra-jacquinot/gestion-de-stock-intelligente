import React from 'react';
import {
  CheckCircle2,
  Clock3,
  PackageCheck,
  Truck,
} from 'lucide-react';

import {
  RestockOrder,
  UserRole,
} from '../types';

interface RestockManagementViewProps {
  orders: RestockOrder[];
  role: UserRole;
  onOrder: (id: string) => Promise<void>;
  onReceive: (id: string) => Promise<void>;
}

export default function RestockManagementView({
  orders,
  role,
  onOrder,
  onReceive,
}: RestockManagementViewProps) {

  const canManage =
    role === 'admin' ||
    role === 'magasinier';

  const getStatusLabel = (
    status: RestockOrder['status']
  ) => {
    switch (status) {
      case 'PENDING':
        return 'En attente';

      case 'ORDERED':
        return 'Commandée';

      case 'RECEIVED':
        return 'Réceptionnée';

      case 'CANCELLED':
        return 'Annulée';

      default:
        return status;
    }
  };

  return (
    <section className="space-y-6">

      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
          Réapprovisionnements
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Suivi des demandes, commandes et réceptions de stock.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-slate-50 dark:bg-slate-800/60">

              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">

                <th className="px-4 py-3">
                  Produit
                </th>

                <th className="px-4 py-3">
                  Quantité
                </th>

                <th className="px-4 py-3">
                  Fournisseur
                </th>

                <th className="px-4 py-3">
                  Demandeur
                </th>

                <th className="px-4 py-3">
                  Statut
                </th>

                <th className="px-4 py-3">
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

              {orders.map((order) => (

                <tr key={order.id}>

                  <td className="px-4 py-4 font-bold">
                    {order.productName}
                  </td>

                  <td className="px-4 py-4">
                    {order.quantity}
                  </td>

                  <td className="px-4 py-4">
                    {order.supplier || '—'}
                  </td>

                  <td className="px-4 py-4">
                    {order.requestedBy}
                  </td>

                  <td className="px-4 py-4">
                    {getStatusLabel(order.status)}
                  </td>

                  <td className="px-4 py-4">

                    {canManage &&
                      order.status === 'PENDING' && (

                        <button
                          onClick={() => onOrder(order.id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-800 px-3 py-2 text-xs font-bold text-white"
                        >
                          <Truck className="h-4 w-4" />

                          Commander
                        </button>
                      )}

                    {canManage &&
                      order.status === 'ORDERED' && (

                        <button
                          onClick={() => onReceive(order.id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
                        >
                          <PackageCheck className="h-4 w-4" />

                          Réceptionner
                        </button>
                      )}

                    {order.status === 'RECEIVED' && (

                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />

                        Terminée
                      </span>
                    )}

                    {order.status === 'PENDING' &&
                      !canManage && (

                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Clock3 className="h-4 w-4" />

                          En attente
                        </span>
                      )}

                  </td>

                </tr>
              ))}

            </tbody>

          </table>

          {orders.length === 0 && (

            <div className="p-10 text-center text-sm text-slate-400">
              Aucune demande de réapprovisionnement.
            </div>
          )}

        </div>

      </div>

    </section>
  );
}
