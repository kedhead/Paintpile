
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background py-10 px-4 md:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <Link href="/signup">
                        <Button variant="ghost" className="gap-2 pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="h-4 w-4" />
                            Back to Sign Up
                        </Button>
                    </Link>
                </div>

                <div className="space-y-8 text-foreground">
                    <div className="border-b border-border pb-6">
                        <h1 className="text-3xl font-display font-bold mb-2">Terms of Service</h1>
                        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                    </div>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold">1. Purpose of Platform</h2>
                        <p className="leading-relaxed">
                            PaintPile is a dedicated platform strictly for the hobby of miniature painting.
                            Our service allows users to track their paint collection, document their painting projects,
                            and share their work with the community. By using this platform, you acknowledge and agree
                            that all content and interactions must be relevant to the miniature painting hobby.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold">2. Prohibited Content</h2>
                        <p className="leading-relaxed">
                            To maintain a safe and focused environment for all ages, the following content is strictly prohibited:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>No Adult Content:</strong> Do not upload, link to, or share any sexually explicit material, nudity, or content suitable only for adults. This includes "not safe for work" (NSFW) images or miniatures depicted in a sexualized manner.</li>
                            <li><strong>No Hate Speech or Harassment:</strong> We have zero tolerance for hate speech, bullying, or harassment of any kind.</li>
                            <li><strong>No Illegal Content:</strong> Do not use the service for any illegal purposes or to share illegal content.</li>
                            <li><strong>No Irrelevant Content:</strong> Content not related to miniature painting, modeling, or the table-top gaming hobby may be removed.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold">3. User Conduct</h2>
                        <p className="leading-relaxed">
                            You agree to use PaintPile in a respectful manner. We reserve the right to remove any content
                            and suspend or terminate accounts that violate these terms, at our sole discretion, without prior notice.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold">4. Account Termination</h2>
                        <p className="leading-relaxed">
                            We reserve the right to terminate or suspend your account immediately, without prior notice or liability,
                            for any reason whatsoever, including without limitation if you breach the Terms of Service.
                            Upon termination, your right to use the Service will cease immediately.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold">5. Disclaimer</h2>
                        <p className="leading-relaxed">
                            The service is provided on an "AS IS" and "AS AVAILABLE" basis. PaintPile makes no warranties,
                            expressed or implied, regarding the reliability or availability of the service.
                        </p>
                    </section>

                    <div className="pt-8 border-t border-border mt-8">
                        <p className="text-sm text-muted-foreground">
                            If you have any questions about these Terms, please contact support.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
