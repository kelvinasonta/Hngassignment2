import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { CompareProvider } from '@/context/CompareContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import CompareFloatingBar from '@/components/CompareFloatingBar';
import FloatingCartButton from '@/components/FloatingCartButton';
import AuthModal from '@/components/AuthModal';

export const metadata: Metadata = {
  title: 'AETHER — Luxury Electronics, Acoustic Hardware & Smart Living',
  description: 'AETHER engineers luxury smartphones, studio planar headphones, minimalist computing hardware, circadian ambient lighting, and architectural smart living solutions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <CompareProvider>
                <div className="ambient-glow" />
                <Header />
                <main>{children}</main>
                <CartDrawer />
                <CompareFloatingBar />
                <FloatingCartButton />
                <AuthModal />
                <Footer />
              </CompareProvider>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
