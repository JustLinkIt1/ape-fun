import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { WalletProvider } from '@/components/WalletProvider'
import { Footer } from '@/components/Footer'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ape Fun - Solana Memecoin Trading',
  description: 'The most advanced memecoin launchpad on Solana',
  keywords: 'solana, memecoin, trading, defi, crypto, ape fun',
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
  openGraph: {
    title: 'Ape Fun - Solana Memecoin Trading',
    description: 'The most advanced memecoin launchpad on Solana',
    images: ['/launchlogo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          {children}
          <Footer />
        </WalletProvider>
      </body>
    </html>
  )
}
