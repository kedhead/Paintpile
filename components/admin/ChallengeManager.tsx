import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { ChallengeEntryList } from '@/components/admin/ChallengeEntryList';

// ... inside ChallengeManager

// Winner Picking State
const [judgingChallengeId, setJudgingChallengeId] = useState<string | null>(null);

// ... inside loadData (no change needed)

function handleWinnerPicked() {
    setJudgingChallengeId(null);
    loadData(); // Refresh to show completed status
}

// ... inside return (List Section) 
<div className="flex items-center gap-2">
    {/* Judge Button - Only for Active Challenges or those ready to judge */}
    {challenge.status !== 'completed' && (
        <Button
            size="sm"
            variant="default"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => setJudgingChallengeId(challenge.id)}
            title="View Entries & Pick Winner"
        >
            <Trophy className="w-4 h-4" />
        </Button>
    )}

    <Button
        // ... (rest of buttons)

        {/* Judging Dialog */}
            <Dialog open={!!judgingChallengeId} onOpenChange={(open) => !open && setJudgingChallengeId(null)}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Judge Challenge</DialogTitle>
            </DialogHeader>
            {judgingChallengeId && (
                <ChallengeEntryList
                    challengeId={judgingChallengeId}
                    onWinnerPicked={handleWinnerPicked}
                />
            )}
        </DialogContent>
    </Dialog>
</div>
    );
}
