import { CashiersList } from "@/components/loyalty/CashiersList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Caissiers",
  description: "Création et gestion des comptes caissiers du magasin",
};

export default function AdminCashiersPage() {
  return <CashiersList />;
}
