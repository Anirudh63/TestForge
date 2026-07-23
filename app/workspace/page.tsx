import WorkspaceBody from '@/components/custom/WorkspaceBody'
import React from 'react'

function Workspace() {
    return (
        <div className='mx-auto max-w-5xl px-4 sm:px-8 py-8 sm:py-10 animate-in fade-in slide-in-from-bottom-2 duration-500'>
            <WorkspaceBody />
        </div>
    )
}

export default Workspace