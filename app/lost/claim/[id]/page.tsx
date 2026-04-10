"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ShieldAlert, ShieldCheck, HelpCircle, MessageSquare, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ClaimVerificationPage() {
    const params = useParams()
    const { id } = params
    const { data: session } = useSession()


    // We need to fetch the item details (for questions) and track the answers
    const [itemDetails, setItemDetails] = useState<any>(null);
    const [answers, setAnswers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [step, setStep] = useState(1)
    const [isVerifying, setIsVerifying] = useState(false)
    const [score, setScore] = useState<number | null>(null)
    const [approvedClaimId, setApprovedClaimId] = useState<string | null>(null)

    // New contextual state
    const [isExactKnown, setIsExactKnown] = useState(true);
    const [exactLocation, setExactLocation] = useState('');
    const [exactTime, setExactTime] = useState('');
    const [lossContext, setLossContext] = useState('');
    const [timelineContext, setTimelineContext] = useState('');

    // 1. Fetch the item's custom security questions when page loads
    useEffect(() => {
        const fetchItem = async () => {
            try {
                const res = await fetch(`/api/item/${id}`);
                const data = await res.json();
                setItemDetails(data);
                setAnswers(Array(data.security_questions?.length || 0).fill(""));
            } catch (e) {
                console.error("Failed to load item", e);
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchItem();
    }, [id]);

    // 2. Poll the claim status after submission
    const pollClaimStatus = async (claimId: string) => {
        let attempts = 0;
        const maxAttempts = 30; // 1 minute max 

        const checkStatus = async () => {
            if (attempts >= maxAttempts) {
                setIsVerifying(false);
                alert("AI processing timed out. Please check your dashboard later.");
                return;
            }

            try {
                // Query the exact claim using our new route
                const res = await fetch(`/api/claims/${claimId}`);
                if (res.ok) {
                    const data = await res.json();

                    if (data.status === 'approved') {
                        // Claim Approved!
                        setScore(data.ai_confidence_score);
                        setApprovedClaimId(claimId);
                        setIsVerifying(false);
                        setStep(2);
                        return;
                    } else if (data.status === 'rejected') {
                        // Claim Rejected
                        setScore(data.ai_confidence_score);
                        setIsVerifying(false);
                        setStep(3);
                        return;
                    } else if (data.status === 'failed') {
                        setIsVerifying(false);
                        setStep(4);
                        return;
                    }
                }
            } catch (e) { }

            attempts++;
            setTimeout(checkStatus, 2000); // Check every 2 secs
        };

        checkStatus();
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsVerifying(true)

        try {
            // Build the contextual string based on what the user provided
            let contextStr = "";
            if (isExactKnown) {
                if (!exactLocation || !exactTime) {
                    alert("Please provide the exact location and time.");
                    setIsVerifying(false);
                    return;
                }
                contextStr = `Claimer claims they lost it precisely at: ${exactLocation} on ${new Date(exactTime).toLocaleString()}.`;
            } else {
                if (!lossContext || !timelineContext) {
                    alert("Please provide the loss and timeline contexts.");
                    setIsVerifying(false);
                    return;
                }
                contextStr = `Claimer does NOT know exact location/time. Loss Context: ${lossContext}. Timeline Context: ${timelineContext}.`;
            }

            const res = await fetch('/api/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: id,
                    claimerId: (session?.user as any)?.id || null,
                    answers: answers,
                    claimerContext: contextStr,
                    claimerLocation: isExactKnown ? exactLocation : null,
                    claimerDate: isExactKnown ? exactTime.split('T')[0] : null,
                    claimerTime: isExactKnown ? exactTime.split('T')[1] : null
                })
            });

            if (!res.ok) throw new Error('Claim submission failed');

            const data = await res.json();

            // Wait for BullMQ worker to finish layer 1, 2, 3 verification
            pollClaimStatus(data.claimId);
        } catch (err) {
            console.error(err);
            alert("Error processing claim.");
            setIsVerifying(false);
        }
    }

    if (isLoading) {
        return <div className="flex justify-center mt-32"><Loader2 className="w-10 h-10 animate-spin text-[#1877F2]" /></div>
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full relative">
            <Button variant="ghost" asChild className="mb-6 -ml-4 text-slate-500 hover:text-slate-900">
                <Link href="/lost/results">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Results
                </Link>
            </Button>

            {/* Step 1: Verification Form */}
            {step === 1 && (
                <Card className="border-slate-200 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                    <CardHeader className="pb-8">
                        <div className="flex items-center gap-2 text-amber-600 mb-2">
                            <ShieldAlert className="w-5 h-5" />
                            <span className="font-semibold text-sm tracking-wide uppercase">Verification Required</span>
                        </div>
                        <CardTitle className="text-2xl">Claim Item {id}</CardTitle>
                        <CardDescription className="text-slate-600">
                            This item is protected. Answer the unique questions generated by our AI when the item was reported found. Only the true owner will know these details.
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleVerify}>
                        <CardContent className="space-y-6">
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-6">
                                <div className="flex gap-3 text-slate-700">
                                    <HelpCircle className="w-5 h-5 shrink-0 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-slate-900 mb-1">Remember the context you provided earlier:</p>
                                        <ul className="list-disc pl-4 text-sm space-y-1">
                                            <li>You are claiming <span className="font-semibold text-slate-800">{itemDetails?.category}</span></li>
                                            <li>AI extracted subcategory: <span className="font-semibold text-slate-800">{itemDetails?.subcategory}</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Section 1: Spatial & Temporal Context */}
                            <div className="space-y-4 pb-6 border-b border-slate-100">
                                <h3 className="text-lg font-semibold text-slate-900">Where and when did you lose it?</h3>

                                <div className="flex items-center space-x-2 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsExactKnown(true)}
                                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${isExactKnown ? 'bg-white text-blue-700 shadow-sm border border-blue-200' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        I know the exact location/time
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsExactKnown(false)}
                                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${!isExactKnown ? 'bg-white text-blue-700 shadow-sm border border-blue-200' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        I&apos;m not exactly sure
                                    </button>
                                </div>

                                <div className="mt-4 space-y-4">
                                    {isExactKnown ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <Label htmlFor="exactLoc">Exact Location Lost <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="exactLoc"
                                                    placeholder="e.g. 3rd Floor Library Desk"
                                                    className="bg-white"
                                                    value={exactLocation}
                                                    onChange={(e) => setExactLocation(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="exactTime">Exact Date &amp; Time <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="exactTime"
                                                    type="datetime-local"
                                                    className="bg-white"
                                                    value={exactTime}
                                                    onChange={(e) => setExactTime(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <Label htmlFor="lossContext">Loss Context <span className="text-red-500">*</span></Label>
                                                <p className="text-xs text-slate-500 mb-1">Where were you coming from, and where were you going?</p>
                                                <Input
                                                    id="lossContext"
                                                    placeholder="e.g. Walking from the cafeteria to the CS building."
                                                    className="bg-white"
                                                    value={lossContext}
                                                    onChange={(e) => setLossContext(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="timelineContext">Timeline Context <span className="text-red-500">*</span></Label>
                                                <p className="text-xs text-slate-500 mb-1">When did you last see or use it?</p>
                                                <Input
                                                    id="timelineContext"
                                                    placeholder="e.g. I know I used it right after lunch yesterday."
                                                    className="bg-white"
                                                    value={timelineContext}
                                                    onChange={(e) => setTimelineContext(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 2: Security Questions */}
                            <div className="space-y-8 pt-2">
                                <h3 className="text-lg font-semibold text-slate-900">Security Questions</h3>
                                {itemDetails?.security_questions?.map((q: string, i: number) => (
                                    <div className="space-y-3" key={i}>
                                        <Label htmlFor={`q${i}`} className="text-base font-semibold text-slate-900 flex gap-2">
                                            <span className="text-[#1877F2]">Q{i + 1}.</span> {q}
                                        </Label>
                                        <Input
                                            id={`q${i}`}
                                            placeholder="Your answer..."
                                            className="py-6 bg-white"
                                            required
                                            value={answers[i] || ''}
                                            onChange={(e) => {
                                                const newAns = [...answers];
                                                newAns[i] = e.target.value;
                                                setAnswers(newAns);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>

                        <CardFooter className="pt-6 border-t border-slate-100 bg-slate-50">
                            <Button type="submit" size="lg" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm" disabled={isVerifying}>
                                {isVerifying ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Running Multi-Layer AI Verification...
                                    </>
                                ) : (
                                    "Verify Ownership"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            )}

            {/* Step 2: Success / Unlock */}
            {step === 2 && score && (
                <Card className="border-green-200 shadow-lg animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                    <div className="bg-green-600 p-8 text-center text-white relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                        <ShieldCheck className="w-16 h-16 mx-auto mb-4 relative z-10" />
                        <h2 className="text-3xl font-bold relative z-10 mb-2">Verification Successful</h2>
                        <p className="text-green-100 relative z-10">AI Confidence Match: {score}%</p>
                    </div>

                    <CardContent className="p-8 text-center">
                        <p className="text-lg text-slate-700 mb-8 max-w-md mx-auto">
                            You've successfully proven ownership! The item has been unblurred and you can now arrange the handover with the finder.
                        </p>

                        {/* The Unblurred Item */}
                        <div className="max-w-sm mx-auto bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 overflow-hidden mb-8 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                            <div className="aspect-video bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                                {itemDetails?.image_url ? (
                                    <img src={itemDetails.image_url} alt="Item" className="w-full h-full object-cover" />
                                ) : (
                                    <span>[Clear Image Unlocked]</span>
                                )}
                            </div>
                            <div className="p-4 text-left">
                                <h3 className="font-bold text-slate-900">{itemDetails?.subcategory || itemDetails?.category || 'Recovered Item'}</h3>
                                <p className="text-sm text-slate-500">Found {itemDetails?.location_found ? `near ${itemDetails.location_found}` : 'securely'}</p>
                            </div>
                        </div>

                        <Button asChild size="lg" className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white py-6 text-lg shadow-md hover:shadow-lg transition-all">
                            <Link href={`/chat/${approvedClaimId || id}`}>
                                <MessageSquare className="mr-2 h-5 w-5" />
                                Open Secure Chat with Finder
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Failure / Rejected */}
            {step === 3 && score !== null && (
                <Card className="border-red-200 shadow-lg animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                    <div className="bg-red-600 p-8 text-center text-white relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                        <ShieldAlert className="w-16 h-16 mx-auto mb-4 relative z-10" />
                        <h2 className="text-3xl font-bold relative z-10 mb-2">Verification Failed</h2>
                        <p className="text-red-100 relative z-10">AI Confidence Match: {score}%</p>
                    </div>

                    <CardContent className="p-8 text-center">
                        <p className="text-lg text-slate-700 mb-8 max-w-md mx-auto">
                            The details you provided did not match closely enough to prove ownership. Access to this item is denied.
                        </p>

                        <Button asChild size="lg" className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                            <Link href={`/lost/results`}>
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Return to Search Results
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 4: System Error */}
            {step === 4 && (
                <Card className="border-amber-200 shadow-lg animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                    <div className="bg-amber-600 p-8 text-center text-white relative">
                        <HelpCircle className="w-16 h-16 mx-auto mb-4 relative z-10" />
                        <h2 className="text-3xl font-bold relative z-10 mb-2">Processing Error</h2>
                        <p className="text-amber-100 relative z-10">The Verification Engine encountered an error.</p>
                    </div>

                    <CardContent className="p-8 text-center">
                        <p className="text-lg text-slate-700 mb-8 max-w-md mx-auto">
                            There was an issue processing your claim. Please try again later.
                        </p>

                        <Button type="button" onClick={() => setStep(1)} size="lg" className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
