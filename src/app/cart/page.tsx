import type { Metadata } from "next";
import { AuthGate } from "@/components/auth-gate";
import { CartView } from "./cart-view";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="container-page py-6">
      <h1 className="mb-6 text-2xl font-bold text-ink">Your cart</h1>
      <AuthGate gate="quick">
        <CartView />
      </AuthGate>
    </div>
  );
}
