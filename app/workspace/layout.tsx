import WorkspaceHeader from '@/components/custom/WorkspaceHeader';
import React from 'react'

function WorkspaceLayout({ children }: {
    children: React.ReactNode;
}) {
    return (
        <div className='min-h-screen bg-[#f8fafc] text-slate-900 relative selection:bg-indigo-500 selection:text-white overflow-x-hidden'>
            {/* Ambient Background Glow */}
            <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-100/50 via-purple-50/30 to-transparent blur-3xl pointer-events-none -z-10' />
            <WorkspaceHeader />
            <main>{children}</main>
        </div>

    )
}

export default WorkspaceLayout