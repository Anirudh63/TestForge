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
import { Settings2 } from 'lucide-react'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { UserRepo } from './WorkspaceBody'
import axios from 'axios'

type props = {
    repo: UserRepo,
    setReload: () => void;
}
function RepoSettings({ repo, setReload }: props) {

    const [isOpen, setIsOpen] = useState(false);
    const [repoSettings, setRepoSettings] = useState({
        targetDomain: repo?.targetDomain || '',
        globalInstruction: repo?.gloablInstruction || ''
    });

    const handleSaveSettings = async () => {
        // Implement the logic to save the updated settings to the database
        // You can make an API call to update the repository settings in the backend
        console.log('Saved Settings:', repoSettings);

        const result = await axios.post('/api/user-repo/settings', {
            repoId: repo.repoId,
            targetDomain: repoSettings.targetDomain,
            globalInstruction: repoSettings.globalInstruction,
        });

        console.log(result?.data);
        setIsOpen(false);
        setReload();

    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
            <DialogTrigger asChild>
                <Button className='bg-white border border-[#edf2f7] text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1a1a2e] h-9 text-xs rounded-xl shadow-xs gap-1.5'>
                    <Settings2 className='h-3.5 w-3.5' /> Config
                </Button>
            </DialogTrigger>
            <DialogContent className='rounded-2xl border border-[#edf2f7] p-6 max-w-md'>
                <DialogHeader className='space-y-1'>
                    <DialogTitle className='flex gap-2 items-center text-base font-bold text-[#1a1a2e]'>
                        <Settings2 className='text-[#6366f1] h-4 w-4' /> Project Settings
                    </DialogTitle>
                    <DialogDescription className='text-xs text-[#94a3b8]'>
                        Configure defaults used during AI script generation.
                    </DialogDescription>
                </DialogHeader>
                <div className='space-y-4 mt-3'>
                    <div className='space-y-1.5'>
                        <label className='text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider'>App URL / Default Website</label>
                        <Input value={repoSettings?.targetDomain}
                            onChange={(e) => setRepoSettings({ ...repoSettings, targetDomain: e.target.value })}
                            placeholder='https://your-app.vercel.app' className='border-[#edf2f7] focus:border-[#6366f1] focus:ring-[#6366f1]/20 h-10 rounded-xl text-xs' />
                        <p className='text-[10px] text-[#94a3b8] leading-normal'>The target address where headless browsers will connect and run test cases.</p>
                    </div>
                    <div className='space-y-1.5'>
                        <label className='text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider'>Global Test Instruction</label>
                        <Textarea value={repoSettings?.globalInstruction}
                            onChange={(e) => setRepoSettings({ ...repoSettings, globalInstruction: e.target.value })}
                            placeholder='Authentication credentials, setup instructions...' className='border-[#edf2f7] focus:border-[#6366f1] focus:ring-[#6366f1]/20 rounded-xl text-xs min-h-[80px]' />
                        <p className='text-[10px] text-[#94a3b8] leading-normal'>Include credentials, cookies, or setup instructions. Appended to AI prompts.</p>
                    </div>
                </div>
                <DialogFooter className='flex gap-2 mt-4'>
                    <DialogClose asChild>
                        <Button variant={'outline'} className='border-[#edf2f7] text-[#64748b] hover:bg-[#f1f5f9] rounded-xl text-xs h-10'>Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSaveSettings} className='bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e6] hover:to-[#7c3aed] text-white shadow-md shadow-indigo-100 rounded-xl text-xs font-semibold h-10'>Save Config</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default RepoSettings