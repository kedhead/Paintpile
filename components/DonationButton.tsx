
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function DonationButton() {
    return (
        <Button
            variant="outline"
            size="sm"
            className="gap-2 text-pink-600 hover:text-pink-700 hover:bg-pink-50 border-pink-200"
            asChild
        >
            <a
                href="https://paypal.me/kendalldavis768"
                target="_blank"
                rel="noopener noreferrer"
            >
                <Heart className="w-4 h-4 fill-current" />
                Donate with PayPal
            </a>
        </Button>
    );
}
