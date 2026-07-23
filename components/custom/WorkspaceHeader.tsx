import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import React from 'react'
import { Beaker } from 'lucide-react'

function WorkspaceHeader() {
    return (
        <header className='flex w-full justify-between items-center h-16 px-6 sm:px-10 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl sticky top-0 z-50 transition-all shadow-[0_1px_10px_rgba(0,0,0,0.02)]'>
            {/* Logo  */}
            <Link href="/workspace" className='flex items-center gap-2.5 no-underline group'>
                <div className='w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200'>
                    <Beaker className='h-5 w-5 text-white' />
                </div>
                <span className='text-xl font-bold tracking-tight text-slate-900'>
                    Test<span className='bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent'>Forge</span>
                </span>
            </Link>

            {/* Navigation Options  */}
            <nav className='flex items-center gap-1.5'>
                <Link href="/workspace" className='px-4 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50/90 border border-indigo-100/80 rounded-full no-underline shadow-2xs flex items-center gap-1.5 hover:bg-indigo-100/80 transition-colors'>
                    <span className='w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse'></span>
                    Workspace
                </Link>
            </nav>

            {/* User Button  */}
            <div className='flex items-center p-0.5 rounded-full ring-2 ring-slate-100 shadow-xs'>
                <UserButton />
            </div>
        </header>
    )
}

export default WorkspaceHeader