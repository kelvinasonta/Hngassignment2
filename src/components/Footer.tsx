import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, CreditCard } from 'lucide-react';
import { getStoreCurrency, getCurrencySymbol } from '@/lib/currency';

export default function Footer() {
  const currencyCode = getStoreCurrency();
  const currencySymbol = getCurrencySymbol(currencyCode);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Col 1: Brand & Philosophy */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--text-main)' }}>
                <path 
                  d="M14 3L4 23H9.2L11.6 17.5H16.4L18.8 23H24L14 3ZM14 11.2L15.4 14.8H12.6L14 11.2Z" 
                  fill="currentColor"
                />
              </svg>
              <span style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '1.5px', fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>
                AETHER
              </span>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '20px', maxWidth: '320px' }}>
              Authentic electronics and precision acoustic hardware designed for enthusiasts who appreciate uncompromising performance, tactile materials, and timeless aesthetic restraint.
            </p>
            {/* Luxury Commerce Trust Marks */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'rgba(56, 189, 248, 0.08)', color: '#38bdf8', padding: '5px 10px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <Lock size={12} /> 256-Bit SSL Encrypted
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'rgba(52, 211, 153, 0.08)', color: '#34d399', padding: '5px 10px', borderRadius: '4px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                <CreditCard size={12} /> Paystack Verified Gateway
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'rgba(129, 140, 248, 0.08)', color: '#a5b4fc', padding: '5px 10px', borderRadius: '4px', border: '1px solid rgba(129, 140, 248, 0.2)' }}>
                <ShieldCheck size={12} /> 2-Year Global Warranty
              </span>
            </div>
          </div>

          {/* Col 2: Hardware Collections */}
          <div>
            <h4 className="footer-col-title">Hardware Collections</h4>
            <ul className="footer-links">
              <li><Link href="/?category=smartphone#products">Smartphones</Link></li>
              <li><Link href="/?category=laptops#products">Computing & Workstations</Link></li>
              <li><Link href="/?category=headphone#products">Studio Planar Monitors</Link></li>
              <li><Link href="/?category=watch#products">Biometric Wearables</Link></li>
              <li><Link href="/?category=speaker#products">Omnidirectional Acoustics</Link></li>
              <li><Link href="/#products">Complete Catalog</Link></li>
            </ul>
          </div>

          {/* Col 3: Client Experience */}
          <div>
            <h4 className="footer-col-title">Client Care</h4>
            <ul className="footer-links">
              <li><Link href="/account/orders">Track Order & Courier</Link></li>
              <li><Link href="/wishlist">Saved Wishlist</Link></li>
              <li><Link href="/checkout">Secure Checkout</Link></li>
              <li><Link href="/account">Customer Account</Link></li>
              <li><Link href="/#products">30-Day Evaluation Guarantee</Link></li>
              <li><Link href="/#products">Concierge Warranty & Support</Link></li>
            </ul>
          </div>

          {/* Col 4: Store & Architecture */}
          <div>
            <h4 className="footer-col-title">Store & Architecture</h4>
            <ul className="footer-links">
              <li><Link href="/#products">Curated Flagships</Link></li>
              <li><Link href="/setup">API & Cloud Integrations Status</Link></li>
              <li><Link href="/checkout">Enterprise Payment Security</Link></li>
              <li><Link href="/#products">Filter by Category</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© 2026 AETHER Electronic Hardware Inc. All rights reserved.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              Store Currency: {currencyCode} ({currencySymbol})
            </span>
            <Link href="/setup">System Status</Link>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
