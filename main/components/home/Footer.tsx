'use client'

import React from 'react'
import Link from 'next/link'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 px-6 md:px-12 relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
             <div className="w-6 h-6 bg-black flex items-center justify-center rounded-md">
                <span className="text-white font-bold text-xs">D</span>
             </div>
             <span className="font-bold text-sm tracking-tight">Draft.</span>
          </div>
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            © 2026 Draft Inc. All rights reserved.
          </p>
        </div>

        <div className="flex gap-8">
            <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono text-gray-400 uppercase">Product</span>
                <Link href="#features" className="text-sm text-gray-600 hover:text-black">Features</Link>
                <Link href="#" className="text-sm text-gray-600 hover:text-black">Enterprise</Link>
                <Link href="#" className="text-sm text-gray-600 hover:text-black">Security</Link>
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono text-gray-400 uppercase">Company</span>
                <Link href="#" className="text-sm text-gray-600 hover:text-black">About</Link>
                <Link href="#" className="text-sm text-gray-600 hover:text-black">Careers</Link>
                <Link href="#" className="text-sm text-gray-600 hover:text-black">Legal</Link>
            </div>
        </div>

        <div className="flex items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-md bg-gray-50">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
             <span className="text-[10px] font-mono text-gray-500 uppercase">All Systems Normal</span>
        </div>
      </div>
    </footer>
  )
}
