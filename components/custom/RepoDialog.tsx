import React, { useContext, useEffect, useMemo, useState } from 'react'
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
import axios from 'axios';
import { Input } from '../ui/input';
import { UserDetailContext } from '@/context/UserDetailContext';
import { Badge } from '../ui/badge';
import { CheckCircle2, Loader2, Plus } from 'lucide-react';

export type Repo = {
    id: number;
    name: string;
    full_name: string;
    private_: boolean;
    html_url: string;
    description: string;
    language: string;
    updated_at: string;
    default_branch: string;
    owner: string;
}

function RepoDialog({ setRefreshPage, addedRepoIds = [] }: { setRefreshPage: (refresh: boolean) => void; addedRepoIds?: number[] }) {

    const [repoList, setRepoList] = useState<Repo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { userDetail } = useContext(UserDetailContext);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            GetRepoList();
        }
    }, [isOpen])

    const GetRepoList = async () => {
        setLoading(true);
        try {
            const result = await axios.get('/api/github/repos');
            console.log(result.data);
            setRepoList(result.data);
        } catch (error: any) {
            console.error("Error fetching repositories:", error);
            if (error.response?.status === 401) {
                window.location.reload();
            }
        } finally {
            setLoading(false);
        }
    }

    const filteredRepoList = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        let list = repoList;

        if (q) {
            list = list.filter(r => r.full_name && r.full_name.toLowerCase().includes(q));
        }

        return list;
    }, [searchTerm, repoList])

    // Set of already-added repo IDs for quick lookup
    const addedRepoIdSet = useMemo(() => new Set(addedRepoIds), [addedRepoIds]);

    const SaveRepoToDB = async () => {
        if (!selectedRepo) return;

        setSaving(true);
        try {
            const result = await axios.post('/api/user-repo', {
                repoId: selectedRepo.id,
                name: selectedRepo.name,
                full_name: selectedRepo.full_name,
                private_: selectedRepo.private_,
                html_url: selectedRepo.html_url,
                description: selectedRepo.description,
                userId: userDetail?.id,
                owner: selectedRepo.owner,
                updatedAt: selectedRepo.updated_at,
                language: selectedRepo.language,
                default_branch: selectedRepo.default_branch,
            });

            console.log(result.data);
            setIsOpen(false);
            setRefreshPage(true);
        } catch (error: any) {
            if (error.response?.status === 409) {
                alert("This repository is already added to your workspace.");
            } else {
                console.error("Error adding repository:", error);
                alert("Failed to add repository. Please try again.");
            }
        } finally {
            setSaving(false);
        }
    }

    const [fetchingPublic, setFetchingPublic] = useState(false);

    const handleFetchPublicRepo = async () => {
        const clean = searchTerm.trim();
        if (!clean.includes('/')) {
            alert("Please enter repository in 'owner/repository' format (e.g. Anirudh63/zenza)");
            return;
        }
        const parts = clean.split('/');
        const owner = parts[0].trim();
        const name = parts[1].trim();

        if (!owner || !name) return;

        setFetchingPublic(true);
        try {
            const res = await axios.get(`https://api.github.com/repos/${owner}/${name}`);
            const data = res.data;
            const repoObj: Repo = {
                id: data.id,
                name: data.name,
                full_name: data.full_name,
                private_: data.private,
                html_url: data.html_url,
                description: data.description || '',
                language: data.language || 'JavaScript',
                updated_at: data.updated_at,
                default_branch: data.default_branch || 'main',
                owner: data.owner.login
            };
            setSelectedRepo(repoObj);
        } catch (e: any) {
            console.error("Failed to fetch public repo:", e);
            alert("Could not find repository '" + clean + "'. Please verify the owner/name format.");
        } finally {
            setFetchingPublic(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
            <DialogTrigger asChild>
                <Button className='bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 gap-2 cursor-pointer'>
                    <Plus className='h-4 w-4' /> Add Repo
                </Button>
            </DialogTrigger>
            <DialogContent className='rounded-2xl border border-slate-200/80 p-6 max-w-md bg-white/95 backdrop-blur-xl shadow-xl'>
                <DialogHeader className='space-y-1'>
                    <DialogTitle className='text-xl font-bold text-slate-900 tracking-tight'>Add Repository</DialogTitle>
                    <DialogDescription className='text-xs text-slate-500'>
                        Select from your list or type <span className='font-mono text-indigo-600 font-semibold'>owner/repo</span> (e.g. Anirudh63/zenza) to import.
                    </DialogDescription>
                </DialogHeader>
                <div className='mt-3 space-y-3'>
                    <div className='flex gap-2'>
                        <Input
                            placeholder='Search or type owner/repo...'
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className='border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 h-10 rounded-xl bg-slate-50/50 text-sm flex-1'
                        />
                        {searchTerm.includes('/') && (
                            <Button
                                size='sm'
                                onClick={handleFetchPublicRepo}
                                disabled={fetchingPublic}
                                className='h-10 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-xl font-medium text-xs cursor-pointer shrink-0'
                            >
                                {fetchingPublic ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : 'Fetch'}
                            </Button>
                        )}
                    </div>
                    {/* Repo List */}
                    {loading ? (
                        <div className='p-8 border border-slate-200/80 rounded-xl mt-4 text-center text-slate-500 text-xs flex items-center justify-center gap-2 bg-slate-50/50'>
                            <Loader2 className='h-4 w-4 animate-spin text-indigo-600' /> Loading repositories...
                        </div>
                    ) : filteredRepoList.length === 0 ? (
                        <div className='p-6 border border-slate-200/80 rounded-xl text-center text-slate-500 text-xs bg-slate-50/50 space-y-2'>
                            <p>No account repositories found.</p>
                            {searchTerm.includes('/') && (
                                <Button
                                    size='sm'
                                    onClick={handleFetchPublicRepo}
                                    disabled={fetchingPublic}
                                    className='bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-medium px-3 py-1.5'
                                >
                                    Import "{searchTerm}"
                                </Button>
                            )}
                        </div>
                    ) : (
                        <ul className='max-h-60 overflow-y-auto border border-slate-200/80 rounded-xl divide-y divide-slate-100'>
                            {filteredRepoList.map((repo) => {
                                const isAlreadyAdded = addedRepoIdSet.has(repo.id);

                                return (
                                    <li
                                        key={repo.id}
                                        className={`p-3 flex items-center justify-between transition-colors
                                            ${isAlreadyAdded
                                                ? 'bg-slate-50 opacity-60 cursor-not-allowed'
                                                : 'hover:bg-indigo-50/50 cursor-pointer'}
                                            ${selectedRepo?.id === repo.id && !isAlreadyAdded ? 'bg-indigo-50/80 border-l-2 border-l-indigo-600' : ''}`}
                                        onClick={() => !isAlreadyAdded && setSelectedRepo(repo)}
                                    >
                                        <div className='flex flex-col min-w-0 pr-2'>
                                            <span className='font-semibold text-xs text-slate-900 truncate'>{repo.full_name}</span>
                                            {repo.language && (
                                                <span className='text-[10px] text-slate-400 mt-0.5'>{repo.language} • {repo.default_branch}</span>
                                            )}
                                        </div>
                                        {isAlreadyAdded && (
                                            <Badge variant='secondary' className='text-[9px] font-semibold gap-1 flex-shrink-0 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full'>
                                                <CheckCircle2 className='h-2.5 w-2.5' /> Added
                                            </Badge>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {selectedRepo && (
                        <div className='p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center justify-between text-xs'>
                            <span className='font-semibold text-indigo-950 truncate'>Selected: {selectedRepo.full_name}</span>
                            <CheckCircle2 className='h-4 w-4 text-indigo-600 shrink-0 ml-2' />
                        </div>
                    )}
                </div>
                <DialogFooter className='flex gap-2 mt-4'>
                    <DialogClose asChild>
                        <Button variant="ghost" className='text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl h-10 cursor-pointer'>Cancel</Button>
                    </DialogClose>
                    <Button
                        disabled={!userDetail || !selectedRepo || saving}
                        onClick={() => SaveRepoToDB()}
                        className='bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold rounded-xl h-10 text-xs shadow-md shadow-indigo-500/20 cursor-pointer'
                    >
                        {saving ? <><Loader2 className='h-3.5 w-3.5 animate-spin mr-1' /> Adding...</>
                            : !userDetail ? 'Loading...' : 'Add Repository'}
                    </Button>
                </DialogFooter>
            </DialogContent>

        </Dialog>
    )
}

export default RepoDialog