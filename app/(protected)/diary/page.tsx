'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserDiaryEntries, createDiaryEntry, updateDiaryEntry, deleteDiaryEntry } from '@/lib/firestore/diary';
import { DiaryEntry, DiaryEntryFormData } from '@/types/diary';
import { DiaryEntryCard } from '@/components/diary/DiaryEntryCard';
import { DiaryEntryDialog } from '@/components/diary/DiaryEntryDialog';
import { Button } from '@/components/ui/Button';
import { Plus, Book, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

export default function DiaryPage() {
    const { currentUser } = useAuth();
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<DiaryEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);

    useEffect(() => {
        if (currentUser) {
            loadEntries();
        }
    }, [currentUser]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredEntries(entries);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = entries.filter(entry =>
            entry.title.toLowerCase().includes(query) ||
            entry.content.toLowerCase().includes(query) ||
            entry.tags.some(tag => tag.toLowerCase().includes(query))
        );
        setFilteredEntries(filtered);
    }, [searchQuery, entries]);

    const loadEntries = async () => {
        if (!currentUser) return;
        try {
            setIsLoading(true);
            const data = await getUserDiaryEntries(currentUser.uid);
            setEntries(data);
            setFilteredEntries(data);
        } catch (error) {
            console.error('Failed to load diary entries', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (data: DiaryEntryFormData) => {
        if (!currentUser) return;
        await createDiaryEntry(currentUser.uid, data);
        loadEntries(); // Refresh list
    };

    const handleUpdate = async (data: DiaryEntryFormData) => {
        if (!editingEntry) return;
        await updateDiaryEntry(editingEntry.entryId, data);
        loadEntries(); // Refresh list
    };

    const handleDelete = async (entryId: string) => {
        if (confirm('Are you sure you want to delete this entry?')) {
            await deleteDiaryEntry(entryId);
            loadEntries(); // Refresh list
        }
    };

    const openNewDialog = () => {
        setEditingEntry(null);
        setIsDialogOpen(true);
    };

    const openEditDialog = (entry: DiaryEntry) => {
        setEditingEntry(entry);
        setIsDialogOpen(true);
    };

    if (!currentUser) return null;

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Book className="w-8 h-8 text-primary" />
                        Paint Diary
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Your personal space for notes, tutorials, and painting logs.
                    </p>
                </div>
                <Button onClick={openNewDialog} size="lg" className="shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-5 h-5 mr-2" />
                    New Entry
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search notes, tags, or content..."
                    className="pl-9 bg-card"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Spinner size="lg" />
                </div>
            ) : filteredEntries.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-border rounded-xl bg-muted/10">
                    <Book className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No entries found</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                        {searchQuery
                            ? `No results matching "${searchQuery}"`
                            : "Start your painting journal by creating your first note."}
                    </p>
                    <Button variant="outline" onClick={openNewDialog}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Entry
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEntries.map(entry => (
                        <DiaryEntryCard
                            key={entry.entryId}
                            entry={entry}
                            onEdit={openEditDialog}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Dialog */}
            <DiaryEntryDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSubmit={editingEntry ? handleUpdate : handleCreate}
                initialData={editingEntry}
            />
        </div>
    );
}
