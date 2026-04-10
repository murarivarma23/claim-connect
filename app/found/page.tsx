"use client"

import { useState } from 'react'
import { Camera, MapPin, Clock, Upload, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function FoundItemPage() {
    const [step, setStep] = useState(1)
    const [isProcessing, setIsProcessing] = useState(false)
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [itemId, setItemId] = useState<string | null>(null);
    const [itemDetails, setItemDetails] = useState<any>(null);
    const [answers, setAnswers] = useState<string[]>([]);

    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/found');
        }
    }, [status, router]);

    const pollItemStatus = async (id: string) => {
        let attempts = 0;
        const maxAttempts = 20; // 40 seconds max 

        const checkStatus = async () => {
            if (attempts >= maxAttempts) {
                setIsProcessing(false);
                alert("AI processing timed out. Please try again later.");
                return;
            }

            try {
                const res = await fetch(`/api/item/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'active') {
                        // Gemini Finished!
                        setItemDetails(data);
                        setAnswers(Array(data.security_questions?.length || 0).fill(""));
                        setIsProcessing(false);
                        setStep(2);
                        return;
                    }
                }
            } catch (e) { }

            attempts++;
            setTimeout(checkStatus, 2000); // Check every 2 secs
        };

        checkStatus();
    };

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsProcessing(true)

        try {
            // If the user hasn't uploaded a real image, block them
            if (imagePreviews.length === 0) {
                alert("Please select at least one image first!");
                setIsProcessing(false);
                return;
            }

            const titleStr = (document.getElementById('title') as HTMLInputElement).value;
            const descriptionStr = (document.getElementById('description') as HTMLTextAreaElement).value;
            const locationStr = (document.getElementById('location') as HTMLInputElement).value;
            const timeStr = (document.getElementById('time') as HTMLInputElement).value;

            // the string comes in as "YYYY-MM-DDTHH:mm", no need to convert to ISO and shift to UTC!
            const datePart = timeStr.split('T')[0];
            const timePart = timeStr.split('T')[1];

            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: titleStr,
                    description: descriptionStr,
                    imageUrls: imagePreviews,
                    location: locationStr,
                    date: datePart,
                    time: timePart,
                    finderId: (session?.user as any)?.id || 'dummy_finder_uuid' // Uses real session ID now
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to upload');
            }

            const data = await res.json();
            setItemId(data.itemId); // Save the DB ID 

            // Start listening for DB updates from the worker
            pollItemStatus(data.itemId);

        } catch (err: any) {
            console.error(err);
            alert(`Error uploading item: ${err.message}`);
            setIsProcessing(false);
        }
    }

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsProcessing(true)

        try {
            if (!itemId) throw new Error("Item ID missing, cannot save answers.");

            const res = await fetch(`/api/item/${itemId}/answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            });

            if (!res.ok) throw new Error("Failed to save answers to database.");

            setStep(3)
        } catch (error) {
            console.error("Error saving answers:", error);
            alert("Failed to save security answers. Please try again.");
        } finally {
            setIsProcessing(false)
        }
    }

    if (status === 'loading') {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Report a Found Item</h1>
                <p className="text-slate-600">Help reunite a lost item with its owner using our secure AI system.</p>
            </div>

            <div className="relative">
                {/* Step Indicators */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-[#1877F2] text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                        <div className={`w-16 h-1 ${step >= 2 ? 'bg-[#1877F2]' : 'bg-slate-200'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-[#1877F2] text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                        <div className={`w-16 h-1 ${step >= 3 ? 'bg-[#1877F2]' : 'bg-slate-200'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 3 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}><CheckCircle2 className="w-5 h-5" /></div>
                    </div>
                </div>

                {/* Step 1: Initial Upload */}
                {step === 1 && (
                    <Card className="border-slate-200 shadow-md rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardHeader>
                            <CardTitle>Basic Details</CardTitle>
                            <CardDescription>Upload a clear photo and provide general context.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleInitialSubmit}>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Item Photos (Up to 4)</Label>
                                    <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50 hover:bg-slate-100 transition-colors group">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/jpeg, image/png, image/webp"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                if (imagePreviews.length + files.length > 4) {
                                                    alert("You can only upload a maximum of 4 photos.");
                                                    return;
                                                }

                                                files.forEach(file => {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        const img = new Image();
                                                        img.onload = () => {
                                                            const canvas = document.createElement('canvas');
                                                            const MAX_DIM = 400; // Resize to max 400px to avoid Supabase payload size limits (fetch failed errors)
                                                            let width = img.width;
                                                            let height = img.height;

                                                            if (width > height) {
                                                                if (width > MAX_DIM) {
                                                                    height *= MAX_DIM / width;
                                                                    width = MAX_DIM;
                                                                }
                                                            } else {
                                                                if (height > MAX_DIM) {
                                                                    width *= MAX_DIM / height;
                                                                    height = MAX_DIM;
                                                                }
                                                            }

                                                            canvas.width = width;
                                                            canvas.height = height;
                                                            const ctx = canvas.getContext('2d');
                                                            ctx?.drawImage(img, 0, 0, width, height);

                                                            // Compress to JPEG with 60% quality
                                                            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                                                            setImagePreviews(prev => {
                                                                if (prev.length < 4) return [...prev, dataUrl];
                                                                return prev;
                                                            });
                                                        };
                                                        img.src = reader.result as string;
                                                    };
                                                    reader.readAsDataURL(file);
                                                });
                                                // Reset input so the same files can trigger onChange again if needed
                                                e.target.value = '';
                                            }}
                                        />

                                        {imagePreviews.length > 0 ? (
                                            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 w-full relative z-20">
                                                {imagePreviews.map((preview, i) => (
                                                    <div key={i} className="aspect-square relative rounded-lg overflow-hidden shadow-sm group/item">
                                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                                                            }}
                                                            className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                                {imagePreviews.length < 4 && (
                                                    <div className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors relative">
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept="image/jpeg, image/png, image/webp"
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            onChange={(e) => {
                                                                const files = Array.from(e.target.files || []);
                                                                const remainingSlots = 4 - imagePreviews.length;
                                                                const filesToProcess = files.slice(0, remainingSlots);

                                                                if (files.length > remainingSlots) {
                                                                    alert(`You can only upload ${remainingSlots} more photo(s).`);
                                                                }

                                                                filesToProcess.forEach(file => {
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => {
                                                                        const img = new Image();
                                                                        img.onload = () => {
                                                                            const canvas = document.createElement('canvas');
                                                                            const MAX_DIM = 400;
                                                                            let width = img.width;
                                                                            let height = img.height;
                                                                            if (width > height) {
                                                                                if (width > MAX_DIM) {
                                                                                    height *= MAX_DIM / width;
                                                                                    width = MAX_DIM;
                                                                                }
                                                                            } else {
                                                                                if (height > MAX_DIM) {
                                                                                    width *= MAX_DIM / height;
                                                                                    height = MAX_DIM;
                                                                                }
                                                                            }
                                                                            canvas.width = width;
                                                                            canvas.height = height;
                                                                            const ctx = canvas.getContext('2d');
                                                                            ctx?.drawImage(img, 0, 0, width, height);
                                                                            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                                                                            setImagePreviews(prev => {
                                                                                if (prev.length < 4) return [...prev, dataUrl];
                                                                                return prev;
                                                                            });
                                                                        };
                                                                        img.src = reader.result as string;
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                });
                                                                e.target.value = '';
                                                            }}
                                                        />
                                                        <Camera className="w-6 h-6 mb-1" />
                                                        <span className="text-xs font-medium">Add Photo</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-8 flex flex-col items-center justify-center h-48">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-105 transition-transform text-[#1877F2] pointer-events-none">
                                                    <Camera className="w-8 h-8" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-700 pointer-events-none">Click to upload up to 4 photos</p>
                                                <p className="text-xs text-slate-500 mt-1 pointer-events-none">PNG, JPG or WEBP</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Item Name <span className="text-red-500">*</span></Label>
                                        <Input id="title" placeholder="e.g. Apple AirPods Pro" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description (Optional)</Label>
                                        <Textarea id="description" placeholder="Any distinct marks, colors, or serial numbers..." className="resize-none" rows={3} />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="location">Exact location found <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input id="location" placeholder="e.g. Main Cafeteria, 3rd Bench" className="pl-9" required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="time">Exact date and time found <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <Input id="time" type="datetime-local" className="w-full" required />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white" disabled={isProcessing}>
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing Image with AI...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload & Analyze
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                )}

                {/* Step 2: AI Dynamic Questions */}
                {step === 2 && (
                    <Card className="border-blue-100 bg-blue-50/30 shadow-md rounded-3xl animate-in fade-in zoom-in-95 duration-500">
                        <CardHeader>
                            <div className="flex items-center gap-2 text-[#1877F2] mb-1">
                                <Sparkles className="w-5 h-5" />
                                <span className="font-semibold text-sm tracking-wide uppercase">AI Extracted Context</span>
                            </div>
                            <CardTitle>Help Us Secure This Item</CardTitle>
                            <CardDescription>
                                Our AI identified this as <span className="font-semibold text-slate-900">{itemDetails?.category} ({itemDetails?.subcategory})</span>. Please answer these specific questions so we can verify the true owner.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleFinalSubmit}>
                            <CardContent className="space-y-5">
                                {itemDetails?.security_questions?.map((q: string, i: number) => (
                                    <div className="space-y-2" key={i}>
                                        <Label htmlFor={`q${i}`} className="text-slate-800">{i + 1}. {q}</Label>
                                        <Input
                                            id={`q${i}`}
                                            placeholder="Your answer..."
                                            className="bg-white"
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
                            </CardContent>
                            <CardFooter className="flex justify-between gap-4">
                                <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isProcessing}>
                                    Back
                                </Button>
                                <Button type="submit" className="flex-1 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white" disabled={isProcessing}>
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Securing Item...
                                        </>
                                    ) : (
                                        "Submit to Secure Database"
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                    <Card className="border-green-200 bg-green-50 text-center py-8 rounded-3xl animate-in zoom-in-95 duration-500">
                        <CardContent className="space-y-4 pt-6">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <CardTitle className="text-2xl text-green-900">Item Secured Successfully!</CardTitle>
                            <CardDescription className="text-green-700 max-w-md mx-auto">
                                Thank you! Your item has been vectorized and securely stored. We are now scanning the database for matches and will notify you if someone claims it.
                            </CardDescription>
                            <div className="pt-6">
                                <Button asChild className="bg-green-600 hover:bg-green-700 text-white mr-4">
                                    <a href="/">Return Home</a>
                                </Button>
                                <Button variant="outline" asChild className="border-green-300 text-green-800 hover:bg-green-100">
                                    <a href="/profile">View My Dashboard</a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

            </div>
        </div>
    )
}
