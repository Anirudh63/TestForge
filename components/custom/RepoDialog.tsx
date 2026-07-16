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
import { CheckCircle2, Loader2 } from 'lucide-react';

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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
            <DialogTrigger asChild>
                <Button>+Add Repo</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Repository</DialogTitle>
                    <DialogDescription>
                        Search and select one of your github repositories
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <Input placeholder='Search Repos by Name' onChange={(event) => setSearchTerm(event.target.value)} />
                    {/* Repo List */}
                    {loading ? (
                        <div className='p-4 border rounded-xl mt-4 text-center text-gray-500 text-sm flex items-center justify-center gap-2'>
                            <Loader2 className='h-4 w-4 animate-spin' /> Loading repositories...
                        </div>
                    ) : filteredRepoList.length === 0 ? (
                        <div className='p-4 border rounded-xl mt-4 text-center text-gray-500 text-sm'>
                            No repositories found.
                        </div>
                    ) : (
                        <ul className='max-h-60 overflow-y-auto border rounded-xl mt-4'>
                            {filteredRepoList.map((repo) => {
                                const isAlreadyAdded = addedRepoIdSet.has(repo.id);

                                return (
                                    <li
                                        key={repo.id}
                                        className={`p-4 border-b flex items-center justify-between
                                            ${isAlreadyAdded
                                                ? 'bg-gray-50 opacity-60 cursor-not-allowed'
                                                : 'hover:bg-gray-100 cursor-pointer'}
                                            ${selectedRepo?.id === repo.id && !isAlreadyAdded ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                                        onClick={() => !isAlreadyAdded && setSelectedRepo(repo)}
                                    >
                                        <div className='flex flex-col'>
                                            <span className='font-medium text-sm'>{repo.full_name}</span>
                                            {repo.language && (
                                                <span className='text-xs text-gray-400 mt-0.5'>{repo.language} • {repo.default_branch}</span>
                                            )}
                                        </div>
                                        {isAlreadyAdded && (
                                            <Badge variant='secondary' className='text-[10px] gap-1 flex-shrink-0'>
                                                <CheckCircle2 className='h-3 w-3 text-green-600' /> Added
                                            </Badge>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <DialogFooter className='flex gap-5'>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button
                        disabled={!userDetail || !selectedRepo || saving}
                        onClick={() => SaveRepoToDB()}
                    >
                        {saving ? <><Loader2 className='h-4 w-4 animate-spin mr-1' /> Adding...</>
                            : !userDetail ? 'Loading...' : 'Add'}
                    </Button>
                </DialogFooter>
            </DialogContent>

        </Dialog>
    )
}

export default RepoDialog