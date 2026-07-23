import Image from 'next/image'
import React from 'react'
import { Button } from '../ui/button'
import { GitBranch, ArrowRight } from 'lucide-react'

function EmptyWorkspace() {
    return (
        <div className='flex flex-col items-center justify-center py-20 px-6 text-center'>
            <div className='relative group mb-6'>
                <div className='absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 to-violet-500 opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-300 pointer-events-none' />
                <div className='relative w-20 h-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-white rounded-2xl flex items-center justify-center border border-indigo-100/80 shadow-sm'>
                    <Image src={'/folder.png'} alt='folder' width={38} height={38} className='drop-shadow-sm' />
                </div>
            </div>
            <h2 className='font-extrabold text-2xl text-slate-900 tracking-tight mb-2'>No repositories added yet</h2>
            <p className='text-slate-500 text-sm max-w-sm mb-8 leading-relaxed font-normal'>
                Connect your GitHub account and link a repository to automatically generate end-to-end AI test cases.
            </p>

            <Button className='bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200'>
                <GitBranch className='h-4 w-4' />
                Connect Repository
                <ArrowRight className='h-4 w-4 ml-0.5' />
            </Button>
        </div>
    )
}

export default EmptyWorkspace