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
    functional: 'bg-blue-100 text-blue-800',
    ui: 'bg-indigo-100 text-indigo-800',
    auth: 'bg-amber-100 text-amber-800',
    form: 'bg-teal-100 text-teal-800',
    integration: 'bg-purple-100 text-purple-800',
    regression: 'bg-orange-100 text-orange-800',
    smoke: 'bg-cyan-100 text-cyan-800',
    performance: 'bg-pink-100 text-pink-800',
    accessibility: 'bg-emerald-100 text-emerald-800',
    security: 'bg-red-100 text-red-800',
    'edge-case': 'bg-gray-100 text-gray-700',
    api: 'bg-violet-100 text-violet-800',
};

const PRIORITY_COLORS: Record<string, string> = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    low: 'bg-green-50 text-green-700 border-green-200',
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
            <div className='flex items-center justify-between mb-3'>
                <h2 className='font-semibold text-lg text-gray-800 flex items-center gap-2'>
                    <ListChecks className='h-5 w-5 text-primary' />
                    Generated Test Cases
                    <span className='text-sm font-normal text-gray-400'>({filteredTestCases.length} of {testCases.length})</span>
                </h2>
                <div className='flex gap-2'>
                    <Button size={'sm'} variant={'outline'} onClick={() => onReload(repository?.repoId)}>
                        <RefreshCw className='h-3 w-3 mr-1' /> Refresh
                    </Button>
                    <Button size={'sm'} onClick={handleRunAll} className='bg-primary text-white gap-1'>
                        <Play className='h-3 w-3 fill-white' /> Run All
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className='flex gap-3 mb-3 items-center flex-wrap'>
                <div className='flex items-center gap-1.5 text-xs text-gray-500'>
                    <Filter className='h-3.5 w-3.5' /> Filters:
                </div>
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className='text-xs border rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary'
                >
                    {uniqueTypes.map(t => (
                        <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className='text-xs border rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary'
                >
                    <option value='all'>All Status</option>
                    <option value='generated'>Pending</option>
                    <option value='passed'>Passed</option>
                    <option value='failed'>Failed</option>
                    <option value='running'>Running</option>
                </select>
            </div>

            {/* Test case list */}
            <div className='border rounded-xl overflow-hidden'>
                {/* Select All Header */}
                <div className='px-4 py-2.5 bg-gray-50 border-b flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={handleSelectAll}
                        />
                        <span className='text-xs font-medium text-gray-500 uppercase tracking-wider'>
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
                                className='h-7 text-xs gap-1'
                            >
                                {deleting ? <Loader2 className='h-3 w-3 animate-spin' /> : <Trash2 className='h-3 w-3' />}
                                Delete ({selectedTestCases.length})
                            </Button>
                        </div>
                    )}
                </div>

                {/* Test Cases */}
                {filteredTestCases.length === 0 ? (
                    <div className='p-8 text-center text-gray-400 text-sm'>
                        No test cases match the current filters.
                    </div>
                ) : (
                    filteredTestCases.map((testCase) => {
                        const isExpanded = expandedId === testCase.id;
                        const priority = (testCase as any).priority || 'medium';

                        return (
                            <div key={testCase.id} className='border-b last:border-b-0'>
                                <div className='p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors'>
                                    <div className='flex gap-3 items-center flex-1 min-w-0'>
                                        <Checkbox
                                            checked={selectedTestCases?.some((item: any) => item.id === testCase?.id)}
                                            onCheckedChange={(checked) => handleSelectedTestCase(checked, testCase)}
                                        />
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : testCase.id)}
                                            className='text-gray-400 hover:text-gray-600 transition-colors'
                                        >
                                            {isExpanded
                                                ? <ChevronUp className='h-4 w-4' />
                                                : <ChevronDown className='h-4 w-4' />}
                                        </button>
                                        <div className='min-w-0 flex-1'>
                                            <h2 className='font-medium text-sm text-gray-800 truncate'>{testCase?.title}</h2>
                                            <p className='text-xs text-gray-400 truncate mt-0.5'>{testCase?.description}</p>
                                        </div>
                                    </div>
                                    <div className='gap-2 flex items-center flex-shrink-0 ml-3'>
                                        <Badge
                                            variant='outline'
                                            className={`text-[10px] font-medium capitalize border ${PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium}`}
                                        >
                                            {priority}
                                        </Badge>
                                        <Badge className={`text-[10px] font-medium capitalize border-none ${TYPE_COLORS[testCase?.type] || 'bg-gray-100 text-gray-700'}`}>
                                            {testCase?.type}
                                        </Badge>

                                        {testCase?.status === 'failed' && (
                                            <Badge variant={'destructive'} className='text-[10px] font-normal gap-1'>
                                                <XCircle className='h-3 w-3' /> Failed
                                            </Badge>
                                        )}
                                        {testCase?.status === 'passed' && (
                                            <Badge className='text-[10px] font-normal bg-emerald-600 text-white gap-1'>
                                                <CheckCircle2 className='h-3 w-3' /> Passed
                                            </Badge>
                                        )}
                                        {testCase?.status === 'running' && (
                                            <Badge className='text-[10px] font-normal bg-amber-500 text-white gap-1'>
                                                <Loader2 className='h-3 w-3 animate-spin' /> Running
                                            </Badge>
                                        )}
                                        {testCase?.status === 'generated' && (
                                            <Badge variant={'secondary'} className='text-[10px]'>Pending</Badge>
                                        )}

                                        <TestCaseSettingDialog testCase={testCase} setReload={() => onReload(repository?.repoId)} />
                                    </div>
                                </div>

                                {/* Expandable Details */}
                                {isExpanded && (
                                    <div className='px-4 pb-4 pt-1 ml-[52px] border-t bg-gray-50/30'>
                                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs'>
                                            <div>
                                                <span className='font-semibold text-gray-500 uppercase text-[10px] tracking-wider'>Target Route</span>
                                                <p className='text-gray-700 font-mono mt-0.5'>{testCase?.targetRoute || '/'}</p>
                                            </div>
                                            <div>
                                                <span className='font-semibold text-gray-500 uppercase text-[10px] tracking-wider'>Expected Result</span>
                                                <p className='text-gray-700 mt-0.5'>{testCase?.expectedResult || 'N/A'}</p>
                                            </div>
                                            {testCase?.targetFiles && testCase.targetFiles.length > 0 && (
                                                <div className='sm:col-span-2'>
                                                    <span className='font-semibold text-gray-500 uppercase text-[10px] tracking-wider'>Target Files</span>
                                                    <div className='flex gap-1.5 flex-wrap mt-1'>
                                                        {testCase.targetFiles.map((f, i) => (
                                                            <span key={i} className='bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono text-[10px]'>
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
                <div className='p-4 flex items-center justify-between bg-gray-50 border-t'>
                    <h2 className='text-sm font-medium text-gray-600'>
                        {selectedTestCases.length > 0
                            ? `Run ${selectedTestCases.length} selected test case(s)`
                            : 'Select test cases to run'}
                    </h2>
                    <Button
                        disabled={selectedTestCases?.length === 0}
                        onClick={() => setIsModelOpen(true)}
                        className='gap-2'
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