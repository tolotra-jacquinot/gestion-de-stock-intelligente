import React, { useEffect, useState } from "react";
import {
  ReceiptText,
  X,
  Printer,
  Plus,
} from "lucide-react";

import { apiFetch } from "../api";

interface BatchUsage {
  batch_number: string;
  expiration_date: string;
  quantity: number;
}

interface SaleItem {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
  batch_usages: BatchUsage[];
}

interface Sale {
  id: number;
  receipt_number: string;
  pharmacy: number;
  pharmacy_name: string;
  sold_by: number;
  sold_by_name: string;
  customer_name: string;
  total_amount: string;
  created_at: string;
  items: SaleItem[];
}

interface Product {
  id: number;
  product: number;
  product_name: string;
  unit_price: string;
  sellable_quantity: number;
  location: number;
  location_name: string;
}

interface CartItem {
  product: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  location: number;
}

export default function SalesView() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] =
  useState<Sale | null>(null);
  const [isNewSaleOpen, setIsNewSaleOpen] =
  useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [selectedProductId, setSelectedProductId] =
  useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [saleError, setSaleError] = useState("");

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await apiFetch(
          "http://127.0.0.1:8000/api/sales/"
        );

        if (!response.ok) {
          throw new Error(
            `Erreur API : ${response.status}`
          );
        }

        const data = await response.json();

        setSales(data);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des ventes :",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiFetch(
        "http://127.0.0.1:8000/api/pharmacy-stocks/"
      );

      if (!response.ok) {
        throw new Error(
          `Erreur API produits : ${response.status}`
        );
      }

      const data = await response.json();

      setProducts(data);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des produits :",
        error
      );
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

    const handleAddToCart = () => {
        setSaleError("");

        const product = products.find(
         (item) =>
            item.product === Number(selectedProductId)
        );

        if (!product) {
            setSaleError("Veuillez sélectionner un produit.");
            return;
        }

        if (quantity <= 0) {
            setSaleError(
            "La quantité doit être supérieure à zéro."
            );
            return;
        }

        const existingItem = cart.find(
          (item) => item.product === product.product
        );

        const quantityAlreadyInCart =
          existingItem?.quantity ?? 0;

        const requestedQuantity =
          quantityAlreadyInCart + quantity;

        if (requestedQuantity > product.sellable_quantity) {
          setSaleError(
            `Stock insuffisant. Disponible en pharmacie : ${product.sellable_quantity}.`
          );
          return;
        }

        setCart((currentCart) => {
            const existingItem = currentCart.find(
              (item) => item.product === product.product
            );

            if (existingItem) {
            return currentCart.map((item) =>
                item.product === product.product
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    }
                : item
            );
            }

            return [
            ...currentCart,
            {
                product: product.product,
                product_name: product.product_name,
                quantity,
                unit_price: Number(product.unit_price),
                location: product.location,
            },
            ];
        });

        setSelectedProductId("");
        setQuantity(1);
        };

    const handleRemoveFromCart = (
        productId: number
        ) => {
        setCart((currentCart) =>
            currentCart.filter(
            (item) => item.product !== productId
            )
        );
        };

    const cartTotal = cart.reduce(
        (total, item) =>
            total + item.unit_price * item.quantity,
        0
        );

  const handleSubmitSale = async () => {
    setSaleError("");

    if (cart.length === 0) {
        setSaleError(
        "Ajoutez au moins un produit au panier."
        );
        return;
    }

    const pharmacyId = cart[0].location;

    try {
        setSubmitting(true);

        const response = await apiFetch(
        "http://127.0.0.1:8000/api/sales/",
        {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
            pharmacy: pharmacyId,
            customer_name: customerName,
            items: cart.map((item) => ({
                product: item.product,
                quantity: item.quantity,
            })),
            }),
        }
        );

        const data = await response.json();

        if (!response.ok) {
        const message =
            data.items ||
            data.detail ||
            "Impossible d'enregistrer la vente.";

        setSaleError(
            Array.isArray(message)
            ? message.join(" ")
            : String(message)
        );

        return;
        }

        setSales((currentSales) => [
        data,
        ...currentSales,
        ]);

        await fetchProducts();

        setSelectedSale(data);

        setCart([]);
        setCustomerName("");
        setSelectedProductId("");
        setQuantity(1);
        setIsNewSaleOpen(false);
    } catch (error) {
        console.error(
        "Erreur lors de la création de la vente :",
        error
        );

        setSaleError(
        "Une erreur est survenue lors de la vente."
        );
    } finally {
        setSubmitting(false);
    }
    };
        
  const handlePrint = () => {
    window.print();
    };

return (
  <div className="p-6 space-y-6">

    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Ventes en pharmacie
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Historique des ventes réalisées à la pharmacie.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setIsNewSaleOpen(true)}
        className="flex items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900"
      >
        <Plus className="h-4 w-4" />
        Nouvelle vente
      </button>
    </div>

    {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          Chargement des ventes...
        </div>
      ) : sales.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <ReceiptText className="mx-auto h-10 w-10 text-slate-400" />

          <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
            Aucune vente enregistrée.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">
                    Reçu
                  </th>

                  <th className="px-4 py-3">
                    Date
                  </th>

                  <th className="px-4 py-3">
                    Client
                  </th>

                  <th className="px-4 py-3">
                    Pharmacien
                  </th>

                  <th className="px-4 py-3">
                    Articles
                  </th>

                  <th className="px-4 py-3 text-right">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <td className="px-4 py-3">
                    <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
                    >
                        {sale.receipt_number}
                    </button>
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {new Date(
                        sale.created_at
                      ).toLocaleString("fr-FR")}
                    </td>

                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {sale.customer_name || "Client comptoir"}
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {sale.sold_by_name}
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {sale.items.reduce(
                        (total, item) =>
                          total + item.quantity,
                        0
                      )}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                      {Number(
                        sale.total_amount
                      ).toLocaleString("fr-FR")}{" "}
                      Ar
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isNewSaleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Nouvelle vente
                </h2>

                <p className="text-sm text-slate-500">
                    Enregistrer une vente à la pharmacie.
                </p>
                </div>

                <button
                type="button"
                onClick={() => setIsNewSaleOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">

            {saleError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {saleError}
                </div>
            )}

            <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Client
                </label>

                <input
                type="text"
                value={customerName}
                onChange={(event) =>
                    setCustomerName(event.target.value)
                }
                placeholder="Nom du client (facultatif)"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Produit
                </label>

                <select
                    value={selectedProductId}
                    onChange={(event) =>
                    setSelectedProductId(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                    <option value="">
                    Sélectionner un produit
                    </option>

                    {products.map((product) => (
                    <option
                        key={product.id}
                        value={product.product}
                    >
                        {product.product_name} —{" "}
                        {Number(
                        product.unit_price
                        ).toLocaleString("fr-FR")}{" "}
                        Ar — disponible : {product.sellable_quantity}
                    </option>
                    ))}
                </select>
                </div>

                <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Quantité
                </label>

                <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(event) =>
                    setQuantity(
                        Number(event.target.value)
                    )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                </div>
            </div>

            <div className="flex justify-end">
                <button
                type="button"
                onClick={handleAddToCart}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                <Plus className="h-4 w-4" />
                Ajouter au panier
                </button>
            </div>

            <div>
                <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
                Panier
                </h3>

                {cart.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700">
                    Aucun produit ajouté.
                </div>
                ) : (
                <div className="space-y-3">
                    {cart.map((item) => (
                    <div
                        key={item.product}
                        className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                        <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                            {item.product_name}
                        </p>

                        <p className="text-sm text-slate-500">
                            {item.quantity} ×{" "}
                            {item.unit_price.toLocaleString(
                            "fr-FR"
                            )}{" "}
                            Ar
                        </p>
                        </div>

                        <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                        <span className="font-bold text-slate-900 dark:text-white">
                            {(
                            item.unit_price *
                            item.quantity
                            ).toLocaleString("fr-FR")}{" "}
                            Ar
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                            handleRemoveFromCart(
                                item.product
                            )
                            }
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            title="Supprimer"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                TOTAL
                </span>

                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                {cartTotal.toLocaleString("fr-FR")} Ar
                </span>
            </div>

            <div className="flex justify-end gap-3">
                <button
                type="button"
                onClick={() => {
                    setIsNewSaleOpen(false);
                    setSaleError("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                >
                Annuler
                </button>

                <button
                type="button"
                onClick={handleSubmitSale}
                disabled={
                    cart.length === 0 ||
                    submitting
                }
                className="rounded-lg bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                {submitting
                    ? "Validation..."
                    : "Valider la vente"}
                </button>
            </div>
            </div>
            </div>
        </div>
        )}

      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:bg-white print:p-0">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-900 print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:shadow-none">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 print:hidden">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Reçu de vente
                </h2>

                <p className="text-sm text-slate-500">
                  {selectedSale.receipt_number}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 print:p-4">
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pharmacie
                </h2>

                <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">
                  {selectedSale.receipt_number}
                </p>
              </div>

              <div className="grid gap-2 border-y border-dashed border-slate-300 py-4 text-sm dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Date
                  </span>

                  <span className="font-medium text-slate-900 dark:text-white">
                    {new Date(
                      selectedSale.created_at
                    ).toLocaleString("fr-FR")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Pharmacie
                  </span>

                  <span className="font-medium">
                    {selectedSale.pharmacy_name}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Pharmacien
                  </span>

                  <span className="font-medium">
                    {selectedSale.sold_by_name}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Client
                  </span>

                  <span className="font-medium">
                    {selectedSale.customer_name ||
                      "Client comptoir"}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {selectedSale.items.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-slate-200 pb-4 dark:border-slate-800"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.product_name}
                        </p>

                        <p className="text-sm text-slate-500">
                          {item.quantity} ×{" "}
                          {Number(
                            item.unit_price
                          ).toLocaleString("fr-FR")}{" "}
                          Ar
                        </p>
                      </div>

                      <p className="font-bold text-slate-900 dark:text-white">
                        {Number(
                          item.subtotal
                        ).toLocaleString("fr-FR")}{" "}
                        Ar
                      </p>
                    </div>

                    {item.batch_usages.length > 0 && (
                      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {item.batch_usages.map(
                          (usage, index) => (
                            <div
                              key={`${usage.batch_number}-${index}`}
                              className="flex flex-wrap justify-between gap-2"
                            >
                              <span>
                                Lot : {usage.batch_number}
                              </span>

                              <span>
                                Qté : {usage.quantity}
                              </span>

                              <span>
                                Exp. :{" "}
                                {new Date(
                                  usage.expiration_date
                                ).toLocaleDateString(
                                  "fr-FR"
                                )}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t-2 border-slate-900 pt-4 dark:border-white">
                <span className="text-lg font-bold">
                  TOTAL
                </span>

                <span className="text-xl font-extrabold">
                  {Number(
                    selectedSale.total_amount
                  ).toLocaleString("fr-FR")}{" "}
                  Ar
                </span>
              </div>

              <p className="mt-8 text-center text-xs text-slate-500">
                Merci pour votre achat.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700"
              >
                Fermer
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}