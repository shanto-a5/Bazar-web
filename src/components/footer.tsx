import Link from "next/link";
import { siteName } from "@/lib/config";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="text-lg font-extrabold tracking-tight text-brand-600">{siteName}</p>
          <p className="mt-2 text-sm text-ink-muted">
            Bangladesh&apos;s friendly marketplace. Shop from trusted sellers with cash on delivery.
          </p>
        </div>
        <nav aria-label="Shop" className="text-sm">
          <h2 className="mb-3 font-semibold text-ink">Shop</h2>
          <ul className="space-y-2 text-ink-muted">
            <li><Link className="hover:text-brand-600" href="/catalogue">All products</Link></li>
            <li><Link className="hover:text-brand-600" href="/categories">Categories</Link></li>
            <li><Link className="hover:text-brand-600" href="/catalogue?sort=new">New arrivals</Link></li>
            <li><Link className="hover:text-brand-600" href="/cart">Cart</Link></li>
          </ul>
        </nav>
        <nav aria-label="Account" className="text-sm">
          <h2 className="mb-3 font-semibold text-ink">Account</h2>
          <ul className="space-y-2 text-ink-muted">
            <li><Link className="hover:text-brand-600" href="/account">My account</Link></li>
            <li><Link className="hover:text-brand-600" href="/account/orders">Orders</Link></li>
            <li><Link className="hover:text-brand-600" href="/account/wishlist">Wishlist</Link></li>
            <li><Link className="hover:text-brand-600" href="/account/addresses">Addresses</Link></li>
          </ul>
        </nav>
        <nav aria-label="Support" className="text-sm">
          <h2 className="mb-3 font-semibold text-ink">Support</h2>
          <ul className="space-y-2 text-ink-muted">
            <li><Link className="hover:text-brand-600" href="/help">Help centre</Link></li>
            <li><Link className="hover:text-brand-600" href="/help#returns">Returns</Link></li>
            <li><Link className="hover:text-brand-600" href="/help#delivery">Delivery</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line py-5">
        <p className="container-page text-center text-xs text-ink-faint">
          © {year} {siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
