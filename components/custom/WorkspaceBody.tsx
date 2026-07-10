"use client"
import React, { useContext } from 'react'
import EmptyWorkspace from './EmptyWorkspace'
import { UserDetailContext } from '@/context/UserDetailContext'
import Image from 'next/image'
import { Button } from '../ui/button'

function WorkspaceBody() {
    const { userDetail } = useContext(UserDetailContext)

    return (
        <div className='w-full'>
            {/* Header / Title Row */}
            <div className='flex justify-between items-center mb-6'>
                <h1 className='text-3xl font-bold text-gray-900'>Workspace</h1>
                <div className='bg-[#eef2ff] text-[#4f46e5] px-4 py-1.5 rounded-full text-sm font-semibold border border-[#e0e7ff]'>
                    Remaining Credits: {userDetail?.credits ?? 1000}
                </div>
            </div>

            {/* GitHub Connect Banner */}
            <div className='flex items-center justify-between border border-gray-200 rounded-xl p-4 mb-6 bg-white shadow-sm'>
                <div className='flex items-center gap-4'>
                    <Image src='/github.png' alt='github' width={40} height={40} />
                    <span className='font-semibold text-gray-800 text-[17px]'>Connect Github & Add Repository</span>
                </div>
                <Button className='bg-[#2b5c37] hover:bg-[#1e4227] text-white font-semibold px-4 py-1.5 rounded transition-all text-sm h-auto cursor-pointer'>
                    Install
                </Button>
            </div>

            {/* Empty State Card */}
            <div className='border border-gray-200 rounded-xl bg-white shadow-sm'>
                <EmptyWorkspace />
            </div>
        </div>
    )
}

export default WorkspaceBody
