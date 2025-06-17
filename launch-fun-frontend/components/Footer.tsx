import { FC } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export const Footer: FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gray-900/50 backdrop-blur-xl border-t border-gray-800 py-4 mt-12"
    >
      <div className="max-w-7xl mx-auto px-4 text-center">
        <Link
          href="https://t.me/ApeFunSolana"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <img src="/telegram.svg" alt="Telegram" className="w-6 h-6" />
        </Link>
      </div>
    </motion.footer>
  )
}
