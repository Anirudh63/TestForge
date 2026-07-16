import React, { useState } from 'react'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '../ui/button'
import { Loader2, SettingsIcon } from 'lucide-react'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { TestCase } from './UserRepoList'
import axios from 'axios'

type props = {
    testCase?: TestCase,
    setReload: any
}

const TEST_TYPES = [
    "functional", "ui", "auth", "form", "integration",
    "regression", "smoke", "performance", "accessibility",
    "security", "edge-case", "api"
];

const PRIORITIES = ["low", "medium", "high"];

function TestCaseSettingDialog({ testCase, setReload }: props) {

    const [isOpen, setIsOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formTestCase, setFormTestCase] = useState({
        title: testCase?.title || '',
        description: testCase?.description || '',
        targetRoute: testCase?.targetRoute || '',
        expectedResult: testCase?.expectedResult || '',
        type: testCase?.type || 'functional',
        priority: testCase?.priority || 'medium',
    });



    const handleInputChange = (fieldName: string, value: string) => {

        setFormTestCase((prev) => ({
            ...prev,
            [fieldName]: value
        }))
    }

    const updateCase = async () => {
        setSaving(true);
        try {
            const result = await axios.post('/api/test-cases/settings', {
                ...formTestCase,
                testCaseId: testCase?.id
            });
            console.log(result?.data);
            setIsOpen(false);
            setReload();
        } catch (err) {
            console.error('Failed to update test case:', err);
            alert('Failed to update test case. Please try again.');
        } finally {
            setSaving(false);
        }
    }


    return (
        <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
            <DialogTrigger>
                <Button size={'icon'} variant={'outline'}>
                    <SettingsIcon className='h-4 w-4' />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Testing Requirements</DialogTitle>
                    <DialogDescription>
                        Modifying these parameters automatically clears pre-generated scripts to ensure synchronization.
                    </DialogDescription>
                </DialogHeader>

                <div>
                    <div className='mt-1'>
                        <label className='text-gray-500 text-xs font-medium uppercase tracking-wider'>TEST TITLE</label>
                        <Input value={formTestCase?.title}
                            onChange={(event) => handleInputChange('title', event?.target?.value)}
                            placeholder='Test Title' className='mt-1' />
                    </div>
                    <div className='mt-4'>
                        <label className='text-gray-500 text-xs font-medium uppercase tracking-wider'>DESCRIPTION/ACTION</label>
                        <Textarea
                            onChange={(event) => handleInputChange('description', event?.target?.value)}
                            value={formTestCase?.description} placeholder='Description' className='mt-1' />
                    </div>

                    <div className='grid grid-cols-2 gap-3 mt-4'>
                        <div>
                            <label className='text-gray-500 text-xs font-medium uppercase tracking-wider'>TEST TYPE</label>
                            <select
                                value={formTestCase.type}
                                onChange={(e) => handleInputChange('type', e.target.value)}
                                className='w-full mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary capitalize'
                            >
                                {TEST_TYPES.map(t => (
                                    <option key={t} value={t} className='capitalize'>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className='text-gray-500 text-xs font-medium uppercase tracking-wider'>PRIORITY</label>
                            <select
                                value={formTestCase.priority}
                                onChange={(e) => handleInputChange('priority', e.target.value)}
                                className='w-full mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary capitalize'
                            >
                                {PRIORITIES.map(p => (
                                    <option key={p} value={p} className='capitalize'>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className='mt-4'>
                        <label className='text-gray-500 text-xs font-medium uppercase tracking-wider'>TARGET ROUTE/PATH</label>
                        <Input value={formTestCase?.targetRoute}
                            onChange={(event) => handleInputChange('targetRoute', event?.target?.value)}
                            placeholder='Target Route' className='mt-1' />
                        <p className='text-[10px] text-gray-400 mt-0.5'>Frontend page path only (e.g. /login, /dashboard). Never use /api/... routes.</p>
                    </div>
                    <div className='mt-4'>
                        <label className='text-gray-500 text-xs font-medium uppercase tracking-wider'>EXPECTED RESULT</label>
                        <Textarea value={formTestCase?.expectedResult}
                            onChange={(event) => handleInputChange('expectedResult', event?.target?.value)}
                            placeholder='Expected Result' className='mt-1' />
                        <p className='text-[10px] text-gray-400 mt-0.5'>What the browser should see after the test (visible text, elements, or URL changes).</p>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose>
                        <Button variant={'outline'}>
                            Cancel</Button></DialogClose>
                    <Button onClick={updateCase} disabled={saving}>
                        {saving ? <><Loader2 className='h-4 w-4 animate-spin mr-1' /> Saving...</> : 'Update Case'}
                    </Button>
                </DialogFooter>
            </DialogContent>

        </Dialog>
    )
}

export default TestCaseSettingDialog