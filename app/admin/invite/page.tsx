import { InviteUserManager } from "@/components/admin/invite/InviteUserManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiche & QR code fidélité",
  description: "Affiche magasin et QR Code d'invitation au club fidélité",
};

export default function AdminInvitePage() {
  return <InviteUserManager />;
}
