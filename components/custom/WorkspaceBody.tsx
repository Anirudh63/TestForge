"use client"
import { UserDetailContext } from '@/context/UserDetailContext'
import Image from 'next/image';
import React, { useContext, useEffect, useState } from 'react'
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import EmptyWorkspace from './EmptyWorkspace';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import RepoDialog, { Repo } from './RepoDialog';
import UserRepoList from './UserRepoList';
import { GitBranch, Zap } from 'lucide-react';

export type UserRepo = {
  id: number;
  repoId: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description: string;
  userId: number;
  owner: string;
  updatedAt: string;
  language: string;
  defaultBranch: string;
  targetDomain?: string;
  gloablInstruction?: string;
}

function WorkspaceBody() {


  const { userDetail } = useContext(UserDetailContext);
  const router = useRouter()
  const [token, setToken] = useState('');
  const [userRepoList, setUserRepoList] = useState<UserRepo[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    GetGithubUserToken();

  }, [])

  useEffect(() => {
    userDetail && GetUserAddedRepoList();
  }, [userDetail])

  const GetGithubUserToken = async () => {
    const result = await axios.get('/api/github/token');
    console.log(result.data.token)
    setToken(result.data.token);
  }

  const OnAddRepo = async () => {
    router.push('/api/github');
  }

  const GetUserAddedRepoList = async () => {
    setLoading(true);
    const result = await axios.get('/api/user-repo?userId=' + userDetail?.id);
    console.log(result.data);
    setUserRepoList(result.data);
    setLoading(false);
  }


  return (
    <div className='space-y-8'>
      {/* Page Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2.5'>
            <h2 className='text-3xl font-extrabold text-slate-900 tracking-tight'>Workspace</h2>
            <span className='px-2.5 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full tracking-wide uppercase'>
              Active
            </span>
          </div>
          <p className='text-sm text-slate-500 mt-1 font-normal'>Manage repositories and AI-generated automated test suites</p>
        </div>
        <div className='flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-indigo-100 shadow-sm shadow-indigo-100/50 hover:border-indigo-200 transition-all duration-200 group cursor-default self-start sm:self-auto'>
          <div className='w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-200'>
            <Zap className='h-3.5 w-3.5 text-white fill-white/20' />
          </div>
          <div className='flex items-baseline gap-1'>
            <span className='text-sm font-bold text-slate-900'>{userDetail?.credits ?? 0}</span>
            <span className='text-xs font-medium text-slate-400'>credits</span>
          </div>
        </div>
      </div>

      {/* GitHub Connection Card */}
      <div className='relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border border-indigo-100/80 rounded-2xl bg-white/90 backdrop-blur-md shadow-[0_4px_20px_rgba(99,102,241,0.05)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] transition-all duration-300 gap-4 group'>
        {/* Background glow decoration */}
        <div className='absolute -right-16 -bottom-16 w-48 h-48 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500' />
        
        <div className='flex items-center gap-4 relative z-10'>
          <div className='w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-md shadow-slate-900/10 border border-slate-800 group-hover:scale-105 transition-transform duration-200 shrink-0'>
            <Image src={'/github.png'} alt='github' width={26} height={26} className='invert brightness-200' />
          </div>
          <div>
            <h2 className='text-base font-bold text-slate-900 tracking-tight'>Connect GitHub Repository</h2>
            <p className='text-xs text-slate-500 mt-0.5 font-normal'>Link your GitHub repository to start generating AI-powered end-to-end test cases</p>
          </div>
        </div>
        <div className='relative z-10 self-end sm:self-auto'>
          {!token ? (
            <Button onClick={OnAddRepo} className='bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 gap-2 cursor-pointer'>
              <GitBranch className='h-4 w-4' /> Setup GitHub
            </Button>
          ) : (
            <RepoDialog setRefreshPage={(refresh: boolean) => GetUserAddedRepoList()} addedRepoIds={userRepoList.map(r => r.repoId)} />
          )}
        </div>
      </div>

      {loading ? (
        <div className='space-y-4 pt-2'>
          <div className='flex items-center justify-between'>
            <div className='bg-slate-200/80 animate-pulse w-32 h-5 rounded-md'></div>
          </div>
          {[1, 2].map((item) => (
            <div key={item} className='w-full h-20 bg-gradient-to-r from-slate-100 via-slate-100/60 to-slate-100 animate-pulse rounded-2xl border border-slate-200/40'></div>
          ))}
        </div>
      ) : userRepoList?.length === 0 ? (
        <div className='border border-slate-200/80 rounded-2xl bg-white/90 backdrop-blur-md shadow-sm overflow-hidden'>
          <EmptyWorkspace />
        </div>
      ) : (
        <UserRepoList repoList={userRepoList} setReload={() => GetUserAddedRepoList()} />
      )}
    </div>
  )
}

export default WorkspaceBody