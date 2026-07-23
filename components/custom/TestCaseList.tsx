"use client";
import React, { useState, useMemo } from 'react';
import { TestCase } from './UserRepoList';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import {
    Play, RefreshCw, Settings, Trash2, CheckCircle2, XCircle,
    ChevronDown, ChevronUp, Filter, ListChecks, Loader2, AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import TestCaseSettingDialog from './TestCaseSettingDialog';
import TestExecutionModal from './TestCaseExecutionModel';
import axios from 'axios';

type Props = {
    testCases: TestCase[];
    onReload: any;
    repository: any;
};

const TYPE_COLORS: Record<string, string> = {
    functional: 'bg-[#eef2ff] text-[#6366f1]',
    ui: 'bg-[#eef2ff] text-[#818cf8]',
    auth: 'bg-[#fefce8] text-[#a16207]',
    form: 'bg-[#ecfdf5] text-[#059669]',
    integration: 'bg-[#f5f3ff] text-[#7c3aed]',
    regression: 'bg-[#fff7ed] text-[#c2410c]',
    smoke: 'bg-[#ecfeff] text-[#0891b2]',
    performance: 'bg-[#fdf2f8] text-[#be185d]',
    accessibility: 'bg-[#ecfdf5] text-[#047857]',
    security: 'bg-[#fef2f2] text-[#dc2626]',
    'edge-case': 'bg-[#f1f5f9] text-[#475569]',
    api: 'bg-[#f5f3ff] text-[#7c3aed]',
};

const PRIORITY_COLORS: Record<string, string> = {
    high: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]',
    medium: 'bg-[#fefce8] text-[#a16207] border-[#fef08a]',
    low: 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]',
};

function TestCaseList({ testCases, onReload, repository }: Props) {
    const [selectedTestCases, setSelectedTestCases] = useState<TestCase[]>([]);
    const [isModelOpen, setIsModelOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Derived data
    const uniqueTypes = useMemo(() => {
        const types = new Set(testCases.map(tc => tc.type));
        return ['all', ...Array.from(types)];
    }, [testCases]);

    const filteredTestCases = useMemo(() => {
        return testCases.filter(tc => {
            const typeMatch = filterType === 'all' || tc.type === filterType;
            const statusMatch = filterStatus === 'all' || tc.status === filterStatus;
            return typeMatch && statusMatch;
        });
    }, [testCases, filterType, filterStatus]);

    const allSelected = filteredTestCases.length > 0 && filteredTestCases.every(tc =>
        selectedTestCases.some(s => s.id === tc.id)
    );

    const handleSelectAll = (checked: boolean | string) => {
        if (checked) {
            setSelectedTestCases(prev => {
                const existingIds = new Set(prev.map(tc => tc.id));
                const newOnes = filteredTestCases.filter(tc => !existingIds.has(tc.id));
                return [...prev, ...newOnes];
            });
        } else {
            const filteredIds = new Set(filteredTestCases.map(tc => tc.id));
            setSelectedTestCases(prev => prev.filter(tc => !filteredIds.has(tc.id)));
        }
    };

    const handleSelectedTestCase = (checked: boolean | string, testCase: TestCase) => {
        if (checked) {
            setSelectedTestCases((prev: any) => [...prev, testCase]);
        } else {
            setSelectedTestCases((prev: any) => prev.filter((item: any) => item.id !== testCase.id));
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedTestCases.length === 0) return;
        const confirmed = window.confirm(`Are you sure you want to delete ${selectedTestCases.length} test case(s)? This cannot be undone.`);
        if (!confirmed) return;

        setDeleting(true);
        try {
            await axios.post('/api/test-cases/delete', {
                testCaseIds: selectedTestCases.map(tc => tc.id),
            });
            setSelectedTestCases([]);
            onReload(repository?.repoId);
        } catch (err) {
            console.error('Failed to delete test cases:', err);
            alert('Failed to delete test cases. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const handleRunAll = () => {
        setSelectedTestCases([...filteredTestCases]);
        setTimeout(() => setIsModelOpen(true), 50);
    };

    return (
        <div>
            {/* Header */}
            <div className='flex items-center justify-between mb-4'>
                <h2 className='font-bold text-sm text-[#1a1a2e] flex items-center gap-2'>
                    <ListChecks className='h-4 w-4 text-[#6366f1]' />
                    Test Cases
                    <span className='text-[11px] font-normal text-[#94a3b8]'>({filteredTestCases.length} of {testCases.length})</span>
                </h2>
                <div className='flex gap-2'>
                    <Button size={'sm'} variant={'outline'} onClick={() => onReload(repository?.repoId)}
                        className='text-xs h-8 border-[#edf2f7] hover:bg-[#f8fafc] text-[#64748b] rounded-lg'>
                        <RefreshCw className='h-3 w-3 mr-1' /> Refresh
                    </Button>
                    <Button size={'sm'} onClick={handleRunAll} className='bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e6] hover:to-[#7c3aed] text-white shadow-md shadow-indigo-50/50 gap-1.5 h-8 text-xs rounded-lg'>
                        <Play className='h-3 w-3 fill-white' /> Run All
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className='flex gap-3 mb-4 items-center flex-wrap'>
                <div className='flex items-center gap-1.5 text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider'>
                    <Filter className='h-3.5 w-3.5' /> Filters:
                </div>
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className='text-xs border border-[#edf2f7] rounded-xl px-3 py-1.5 bg-white text-[#64748b] focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1] h-8 capitalize'
                >
                    {uniqueTypes.map(t => (
                        <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className='text-xs border border-[#edf2f7] rounded-xl px-3 py-1.5 bg-white text-[#64748b] focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1] h-8'
                >
                    <option value='all'>All Status</option>
                    <option value='generated'>Pending</option>
                    <option value='passed'>Passed</option>
                    <option value='failed'>Failed</option>
                    <option value='running'>Running</option>
                </select>
            </div>

            {/* Test case list */}
            <div className='border border-[#edf2f7] rounded-2xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]'>
                {/* Select All Header */}
                <div className='px-4 py-2.5 bg-[#f8fafc] border-b border-[#edf2f7] flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={handleSelectAll}
                        />
                        <span className='text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider'>
                            {selectedTestCases.length > 0
                                ? `${selectedTestCases.length} selected`
                                : 'Select All'}
                        </span>
                    </div>
                    {selectedTestCases.length > 0 && (
                        <div className='flex gap-2'>
                            <Button
                                size={'sm'}
                                variant={'destructive'}
                                onClick={handleDeleteSelected}
                                disabled={deleting}
                                className='h-7 text-xs gap-1 rounded-lg'
                            >
                                {deleting ? <Loader2 className='h-3 w-3 animate-spin' /> : <Trash2 className='h-3 w-3' />}
                                Delete ({selectedTestCases.length})
                            </Button>
                        </div>
                    )}
                </div>

                {/* Test Cases */}
                {filteredTestCases.length === 0 ? (
                    <div className='p-12 text-center text-[#94a3b8] text-xs bg-[#f8fafc]'>
                        No test cases match the current filters.
                    </div>
                ) : (
                    filteredTestCases.map((testCase) => {
                        const isExpanded = expandedId === testCase.id;
                        const priority = (testCase as any).priority || 'medium';

                        return (
                            <div key={testCase.id} className='border-b border-[#edf2f7] last:border-b-0'>
                                <div className='p-4 flex items-center justify-between hover:bg-[#f8fafc] transition-colors'>
                                    <div className='flex gap-3 items-center flex-1 min-w-0'>
                                        <Checkbox
                                            checked={selectedTestCases?.some((item: any) => item.id === testCase?.id)}
                                            onCheckedChange={(checked) => handleSelectedTestCase(checked, testCase)}
                                        />
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : testCase.id)}
                                            className='text-[#94a3b8] hover:text-[#64748b] transition-colors'
                                        >
                                            {isExpanded
                                                ? <ChevronUp className='h-4 w-4' />
                                                : <ChevronDown className='h-4 w-4' />}
                                        </button>
                                        <div className='min-w-0 flex-1'>
                                            <h2 className='font-semibold text-xs text-[#1a1a2e] truncate'>{testCase?.title}</h2>
                                            <p className='text-[11px] text-[#94a3b8] truncate mt-0.5'>{testCase?.description}</p>
                                        </div>
                                    </div>
                                    <div className='gap-2 flex items-center flex-shrink-0 ml-3'>
                                        <Badge
                                            variant='outline'
                                            className={`text-[9px] font-bold capitalize border px-2 py-0.5 rounded-full ${PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium}`}
                                        >
                                            {priority}
                                        </Badge>
                                        <Badge className={`text-[9px] font-bold capitalize border-none px-2 py-0.5 rounded-full ${TYPE_COLORS[testCase?.type] || 'bg-[#f1f5f9] text-[#475569]'}`}>
                                            {testCase?.type}
                                        </Badge>

                                        {testCase?.status === 'failed' && (
                                            <Badge variant={'destructive'} className='text-[9px] font-semibold gap-1 px-2.5 py-0.5 rounded-full'>
                                                <XCircle className='h-2.5 w-2.5' /> Failed
                                            </Badge>
                                        )}
                                        {testCase?.status === 'passed' && (
                                            <Badge className='text-[9px] font-semibold bg-[#10b981] text-white gap-1 px-2.5 py-0.5 rounded-full'>
                                                <CheckCircle2 className='h-2.5 w-2.5' /> Passed
                                            </Badge>
                                        )}
                                        {testCase?.status === 'running' && (
                                            <Badge className='text-[9px] font-semibold bg-[#f59e0b] text-white gap-1 px-2.5 py-0.5 rounded-full'>
                                                <Loader2 className='h-2.5 w-2.5 animate-spin' /> Running
                                            </Badge>
                                        )}
                                        {testCase?.status === 'generated' && (
                                            <Badge variant={'secondary'} className='text-[9px] font-semibold px-2.5 py-0.5 rounded-full bg-[#f1f5f9] text-[#64748b] border-none'>Pending</Badge>
                                        )}

                                        <TestCaseSettingDialog testCase={testCase} setReload={() => onReload(repository?.repoId)} />
                                    </div>
                                </div>

                                {/* Expandable Details */}
                                {isExpanded && (
                                    <div className='px-4 pb-4 pt-2.5 ml-[52px] border-t border-[#edf2f7] bg-[#fafbfc] rounded-b-xl'>
                                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs'>
                                            <div>
                                                <span className='font-bold text-[#94a3b8] uppercase text-[9px] tracking-wider'>Target Route</span>
                                                <p className='text-[#475569] font-mono text-[11px] mt-1 bg-[#f8fafc] border border-[#edf2f7] rounded-lg px-2.5 py-1.5 inline-block'>{testCase?.targetRoute || '/'}</p>
                                            </div>
                                            <div>
                                                <span className='font-bold text-[#94a3b8] uppercase text-[9px] tracking-wider'>Expected Result</span>
                                                <p className='text-[#475569] mt-1 text-[11px] bg-[#f8fafc] border border-[#edf2f7] rounded-lg px-2.5 py-1.5'>{testCase?.expectedResult || 'N/A'}</p>
                                            </div>
                                            {testCase?.targetFiles && testCase.targetFiles.length > 0 && (
                                                <div className='sm:col-span-2'>
                                                    <span className='font-bold text-[#94a3b8] uppercase text-[9px] tracking-wider'>Target Files</span>
                                                    <div className='flex gap-1.5 flex-wrap mt-1.5'>
                                                        {testCase.targetFiles.map((f, i) => (
                                                            <span key={i} className='bg-white border border-[#edf2f7] text-[#475569] px-2 py-0.5 rounded-lg font-mono text-[10px]'>
                                                                {f}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                {/* Footer: Run Selected */}
                <div className='p-4 flex items-center justify-between bg-[#f8fafc] border-t border-[#edf2f7]'>
                    <h2 className='text-xs font-semibold text-[#64748b]'>
                        {selectedTestCases.length > 0
                            ? `Run ${selectedTestCases.length} selected test case(s)`
                            : 'Select test cases to run'}
                    </h2>
                    <Button
                        disabled={selectedTestCases?.length === 0}
                        onClick={() => setIsModelOpen(true)}
                        className='gap-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e6] hover:to-[#7c3aed] text-white shadow-md shadow-indigo-100 rounded-xl px-5 py-2'
                    >
                        <Play className='h-4 w-4 fill-white' /> Run Test Cases
                    </Button>
                </div>
            </div>

            <TestExecutionModal
                testCases={selectedTestCases}
                repository={repository}
                isOpen={isModelOpen}
                onClose={() => { setIsModelOpen(false); onReload(repository?.repoId); }}
            />
        </div>
    );
}

export default TestCaseList;