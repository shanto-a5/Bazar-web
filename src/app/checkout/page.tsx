import type { Metadata } from "next";
import { AuthGate } from "@/components/auth-gate";
import { CheckoutView } from "./checkout-view";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="container-page py-6">
      <h1 className="mb-6 text-2xl font-bold text-ink">Checkout</h1>
      <AuthGate gate="quick">
        <CheckoutView />
      </AuthGate>
    </div>
  );
}
