import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EigenX402 - Pay-per-Proof AI',
  description: 'Stripe-for-Web3: Crypto payments with verifiable compute',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
