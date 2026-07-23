import React, { useContext, useState } from 'react'
import { UserRepo } from './WorkspaceBody'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import Image from 'next/image'
import { CheckCircle2, GitBranch, Globe2Icon, Link2Icon, ListChecks, Loader2, Loader2Icon, Settings2, Sparkles, Trash2, TrendingUp, XCircle } from 'lucide-react'
import { Button } from '../ui/button'
import axios from 'axios'
import { UserDetailContext } from '@/context/UserDetailContext'
import TestCaseList from './TestCaseList'
import RepoSettings from './RepoSettings'

type props = {
    repoList: UserRepo[],
    setReload: () => void;
}

export type TestCase = {
    id: number;
    title: string;
    description: string;
    type: string;
    priority: string;
    repoId: number;
    targetFiles: string[];
    expectedResult: string;
    repoName: string;
    repoOwner: string;
    targetRoute: string;
    status: string;
    browserbaseScript: string;
}

type StatusData = {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    passRate: number;
}

function UserRepoList({ repoList, setReload }: props) {

    const [statusData, setStatusData] = useState<StatusData>({
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        passRate: 0
    });


    const { userDetail } = useContext(UserDetailContext);
    const [loading, setLoading] = useState(false);
    const [testCaseLoading, setTestCaseLoading] = useState(false);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [deletingRepoId, setDeletingRepoId] = useState<number | null>(null);

    const handleGenerateTestCases = async (repo: UserRepo) => {
        setLoading(true);
        try {
            // Implement the logic to call the API route to generate test cases for the selected repository
            const result = await axios.post('/api/generate-test-cases', {
                userId: userDetail?.id,
                repoId: repo?.repoId,
                owner: repo.owner,
                repo: repo.name,
                branch: repo.defaultBranch,
            });

            console.log(result.data);
            // Refresh test cases list in the UI after generation
            await GetTestCases(repo?.repoId);
        } catch (error) {
            console.error("Failed to generate test cases:", error);
            alert("Failed to generate test cases. Please ensure your GitHub authorization is active.");
        } finally {
            setLoading(false);
        }
    }

    const GetTestCases = async (repoId: number) => {
        // Implement the logic to fetch test cases for the selected repository and display them in a user-friendly format
        setTestCaseLoading(true);
        setTestCases([]);
        const result = await axios.get(`/api/test-cases?repoId=${repoId}`);
        console.log(result.data);
        const userTestCases = result.data as TestCase[];
        const passedTests = userTestCases?.filter(testCase => testCase.status == 'passed').length || 0;
        const failedTests = userTestCases?.filter(testCase => testCase.status == 'failed').length || 0;
        const passRate = userTestCases?.length ? Math.round((passedTests / userTestCases.length) * 100) : 0;


        setStatusData({
            totalTests: result.data.length,
            passedTests: passedTests,
            failedTests: failedTests,
            passRate: passRate
        })

        setTestCases(result.data);
        setTestCaseLoading(false);

    }

    const handleDeleteRepo = async (repo: UserRepo) => {
        const confirmed = window.confirm(`Are you sure you want to remove "${repo.fullName}" and all its test cases? This cannot be undone.`);
        if (!confirmed) return;

        setDeletingRepoId(repo.repoId);
        try {
            await axios.post('/api/user-repo/delete', {
                repoId: repo.repoId,
                userId: userDetail?.id,
            });
            setReload();
        } catch (err) {
            console.error("Failed to delete repository:", err);
            alert("Failed to delete repository. Please try again.");
        } finally {
            setDeletingRepoId(null);
        }
    };

    return (
        <div className='mt-8'>
            <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2'>
                    <span>Your Repositories</span>
                    <span className='px-2 py-0.5 text-[10px] font-bold text-slate-600 bg-slate-200/70 rounded-full'>
                        {repoList.length}
                    </span>
                </h2>
            </div>
            <Accordion type="single" collapsible
                onValueChange={(value) => GetTestCases(Number(value))}
            >
                {repoList.map((repo, index) => (

                    <AccordionItem key={repo.repoId} value={(repo.repoId).toString()} className='border border-slate-200/80 hover:border-indigo-200/80 px-5 rounded-2xl mb-4 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden group'>
                        <AccordionTrigger className='py-4 hover:no-underline'>
                            <div className='flex items-center gap-4 text-left'>
                                <div className='w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 shadow-xs group-hover:scale-105 transition-transform duration-200 shrink-0'>
                                    <Image src={'/github.png'} alt='github' width={20} height={20} className='invert brightness-200' />
                                </div>
                                <div className='flex flex-col items-start gap-1'>
                                    <h2 className='text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors'> {repo.fullName}</h2>
                                    <div className='flex items-center gap-2 flex-wrap'>
                                        <span className='inline-flex items-center gap-1 text-[11px] font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60'>
                                            <GitBranch className='h-3 w-3 text-slate-400' />
                                            {repo.defaultBranch}
                                        </span>
                                        {repo.language && (
                                            <span className='text-[11px] font-medium text-slate-500 flex items-center gap-1.5'>
                                                <span className='w-2 h-2 rounded-full bg-indigo-500'></span>
                                                {repo.language}
                                            </span>
                                        )}
                                    </div>
                                </div>

                            </div>

                        </AccordionTrigger>

                        <AccordionContent>
                            <div className='pt-2 pb-3 space-y-5'>

                                <div className='bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 p-4 border border-slate-200/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                                    <div className='flex gap-3 items-center flex-wrap'>
                                        <div className='w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0'>
                                            <Link2Icon className='text-indigo-600 h-3.5 w-3.5' />
                                        </div>
                                        <h2 className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Target Domain:</h2>
                                        <span className='bg-white px-3 py-1 border border-indigo-100 rounded-lg text-indigo-600 font-mono text-xs font-semibold shadow-2xs'>
                                            {repo?.targetDomain || 'Not configured'}
                                        </span>
                                    </div>
                                    <div className='flex gap-2 items-center self-end sm:self-auto'>
                                        <RepoSettings repo={repo} setReload={setReload} />
                                        <Button
                                            variant={'destructive'}
                                            size={'sm'}
                                            onClick={() => handleDeleteRepo(repo)}
                                            disabled={deletingRepoId === repo.repoId}
                                            className='gap-1.5 rounded-lg text-xs font-medium shadow-2xs cursor-pointer'
                                        >
                                            {deletingRepoId === repo.repoId
                                                ? <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                                : <Trash2 className='h-3.5 w-3.5' />
                                            }
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5'>

                                    <StatusCard
                                        title="Total Tests"
                                        value={statusData?.totalTests}
                                        icon={<ListChecks className='h-4 w-4 text-indigo-600' />}
                                        bgColor="bg-indigo-50 border border-indigo-100"
                                    />

                                    <StatusCard
                                        title="Passed"
                                        value={statusData?.passedTests}
                                        icon={<CheckCircle2 className='h-4 w-4 text-emerald-600' />}
                                        bgColor="bg-emerald-50 border border-emerald-100"
                                    />

                                    <StatusCard
                                        title="Failed"
                                        value={statusData?.failedTests}
                                        icon={<XCircle className='h-4 w-4 text-rose-600' />}
                                        bgColor="bg-rose-50 border border-rose-100"
                                    />

                                    <StatusCard
                                        title="Pass Rate"
                                        value={`${statusData?.passRate}%`}
                                        icon={<TrendingUp className='h-4 w-4 text-violet-600' />}
                                        bgColor="bg-violet-50 border border-violet-100"
                                    />
                                </div>

                                {!testCaseLoading && testCases.length > 0
                                    && <TestCaseList testCases={testCases} onReload={(repoId: number) => GetTestCases(repoId)}
                                        repository={repo}
                                    />}

                                {testCaseLoading ?
                                    <div className='flex items-center gap-3 py-6 px-4 justify-center text-sm font-medium text-slate-500 bg-slate-50/50 rounded-xl border border-slate-200/60'>
                                        <Loader2Icon className='animate-spin h-4 w-4 text-indigo-600' /> Loading test cases...
                                    </div>
                                    :
                                    testCases?.length == 0 && (
                                        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-indigo-100/90 rounded-2xl p-6 bg-gradient-to-r from-indigo-50/90 via-purple-50/40 to-white shadow-sm'>
                                            <div>
                                                <div className='flex items-center gap-2'>
                                                    <Sparkles className='h-4 w-4 text-indigo-600' />
                                                    <h3 className='font-bold text-base text-slate-900'>
                                                        {loading ? 'Generating test cases...' : 'Generate AI Test Cases'}
                                                    </h3>
                                                </div>
                                                <p className='text-xs text-slate-500 mt-1 max-w-md leading-relaxed'>
                                                    Analyze code structure in this repository and generate automated end-to-end test cases powered by AI.
                                                </p>
                                            </div>

                                            <Button className='gap-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer shrink-0'
                                                disabled={loading}
                                                onClick={() => handleGenerateTestCases(repo)}>
                                                {loading ? <Loader2 className='animate-spin h-4 w-4' /> : <Sparkles className='h-4 w-4' />}
                                                Generate Test Cases
                                            </Button>
                                        </div>
                                    )}
                            </div>
                        </AccordionContent>

                    </AccordionItem>

                ))}
            </Accordion>
        </div>
    )
}

export default UserRepoList



function StatusCard({
    title,
    value,
    icon,
    bgColor
}: {
    title: string
    value: string | number
    icon: React.ReactNode
    bgColor: string
}) {
    return (
        <div className='border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between bg-white shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'>
            <div>
                <p className='text-[11px] text-slate-400 font-semibold uppercase tracking-wider'>{title}</p>
                <h3 className='text-2xl font-extrabold mt-1 text-slate-900 tracking-tight'>{value}</h3>
            </div>

            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shadow-2xs ${bgColor}`}>
                {icon}
            </div>
        </div>
    )
}