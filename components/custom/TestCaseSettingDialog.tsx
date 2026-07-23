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
            <DialogTrigger asChild>
                <Button size={'icon'} variant={'outline'} className='border-[#edf2f7] text-[#64748b] hover:text-[#1a1a2e] h-8 w-8 rounded-lg'>
                    <SettingsIcon className='h-3.5 w-3.5' />
                </Button>
            </DialogTrigger>
            <DialogContent className='rounded-2xl border border-[#edf2f7] p-6 max-w-md'>
                <DialogHeader className='space-y-1'>
                    <DialogTitle className='text-base font-bold text-[#1a1a2e]'>Edit Test Case</DialogTitle>
                    <DialogDescription className='text-xs text-[#94a3b8]'>
                        Modifying parameters automatically clears pre-generated scripts to ensure synchronization.
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-3.5 mt-3'>
                    <div className='space-y-1'>
                        <label className='text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider'>Test Title</label>
                        <Input value={formTestCase?.title}
                            onChange={(event) => handleInputChange('title', event?.target?.value)}
                            placeholder='Test Title' className='border-[#edf2f7] focus:border-[#6366f1] focus:ring-[#6366f1]/20 h-10 rounded-xl text-xs' />
                    </div>
                    <div className='space-y-1'>
                        <label className='text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider'>Description / Action</label>
                        <Textarea
                            onChange={(event) => handleInputChange('description', event?.target?.value)}
                            value={formTestCase?.description} placeholder='Describe the test action...' className='border-[#edf2f7] focus:border-[#6366f1] focus:ring-[#6366f1]/20 rounded-xl text-xs min-h-[60px]' />
                    </div>

                    <div className='grid grid-cols-2 gap-3'>
                        <div className='space-y-1'>
                            <label className='text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider'>Test Type</label>
                            <select
                                value={formTestCase.type}
                                onChange={(e) => handleInputChange('type', e.target.value)}
                                className='w-full rounded-xl border border-[#edf2f7] px-3 py-2 text-xs bg-white text-[#475569] focus:outline-none focus:ring-1 focus:ring-[#6366f1] capitalize h-10'
                            >
                                {TEST_TYPES.map(t => (
                                    <option key={t} value={t} className='capitalize'>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div className='space-y-1'>
                            <label className='text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider'>Priority</label>
                            <select
                                value={formTestCase.priority}
                                onChange={(e) => handleInputChange('priority', e.target.value)}
                                className='w-full rounded-xl border border-[#edf2f7] px-3 py-2 text-xs bg-white text-[#475569] focus:outline-none focus:ring-1 focus:ring-[#6366f1] capitalize h-10'
                            >
                                {PRIORITIES.map(p => (
                                    <option key={p} value={p} className='capitalize'>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className='space-y-1'>
                        <label className='text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider'>Target Route / Path</label>
                        <Input value={formTestCase?.targetRoute}
                            onChange={(event) => handleInputChange('targetRoute', event?.target?.value)}
                            placeholder='/login, /dashboard' className='border-[#edf2f7] focus:border-[#6366f1] focus:ring-[#6366f1]/20 h-10 rounded-xl text-xs' />
                        <p className='text-[10px] text-[#94a3b8] leading-normal'>Frontend path only (e.g. /login). Never use /api/... routes.</p>
                    </div>
                    <div className='space-y-1'>
                        <label className='text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider'>Expected Result</label>
                        <Textarea value={formTestCase?.expectedResult}
                            onChange={(event) => handleInputChange('expectedResult', event?.target?.value)}
                            placeholder='What should appear after the test...' className='border-[#edf2f7] focus:border-[#6366f1] focus:ring-[#6366f1]/20 rounded-xl text-xs min-h-[60px]' />
                        <p className='text-[10px] text-[#94a3b8] leading-normal'>What the browser should see after the test (text, elements, or URL changes).</p>
                    </div>
                </div>
                <DialogFooter className='flex gap-2 mt-4'>
                    <DialogClose asChild>
                        <Button variant={'outline'} className='border-[#edf2f7] text-[#64748b] hover:bg-[#f1f5f9] rounded-xl text-xs h-10'>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button onClick={updateCase} disabled={saving} className='bg-[#6366f1] hover:bg-[#5558e6] text-white bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e6] hover:to-[#7c3aed] shadow-md shadow-indigo-100 rounded-xl text-xs font-semibold h-10'>
                        {saving ? <><Loader2 className='h-3.5 w-3.5 animate-spin mr-1' /> Saving...</> : 'Update Case'}
                    </Button>
                </DialogFooter>
            </DialogContent>

        </Dialog>
    )
}

export default TestCaseSettingDialog