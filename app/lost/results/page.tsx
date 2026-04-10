"use client"

import Link from 'next/link'
import { Search, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ResultsContent() {
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchParams = useSearchParams();
    const queryStr = searchParams.get('q');

    useEffect(() => {
        const fetchResults = async () => {
            if (queryStr) {
                // If we have a query parameter from the Home page search, fetch it
                setIsSearching(true);
                try {
                    const res = await fetch('/api/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            query: queryStr,
                            locationContext: '',
                            timeContext: ''
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setResults(data.results || []);
                    }
                } catch (err) {
                    console.error("Failed to perform direct search:", err);
                } finally {
                    setIsSearching(false);
                }
            }
        };

        fetchResults();
    }, [queryStr]);

    if (isSearching) {
        return (
            <div className="flex flex-col items-center justify-center py-32 flex-1 w-full">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Scanning Database</h2>
                <p className="text-slate-500">Our AI is searching for matches...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Search Results</h1>
                    <p className="text-slate-600">
                        We found {results.length} potential matches for your item.
                    </p>
                </div>
                <Button variant="outline" asChild className="shrink-0 bg-white">
                    <Link href="/lost">
                        <Search className="w-4 h-4 mr-2" />
                        Modify Search
                    </Link>
                </Button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex items-start gap-4">
                <Info className="w-5 h-5 text-[#1877F2] shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Privacy First Defense</p>
                    <p>
                        Images and exact details are blurred to prevent fraud. Select the item you believe is yours, and our AI will verify ownership.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                        <div className="relative aspect-[4/3] bg-slate-200 overflow-hidden text-slate-300 flex items-center justify-center">
                            {/* Blurred Image Placeholder */}
                            <div
                                className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300"
                                style={{ filter: "blur(20px)", transform: "scale(1.1)" }}
                            ></div>
                            <div className="relative z-10 flex flex-col items-center opacity-80 group-hover:opacity-100 transition-opacity">
                                <Search className="w-12 h-12 mb-2" />
                                <span className="font-semibold tracking-wider uppercase text-sm">Protected</span>
                            </div>
                        </div>

                        <CardHeader className="pb-3.5">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-medium">
                                    {item.category}
                                </Badge>
                                <Badge
                                    className={
                                        (item.similarity * 100) > 85 ? "bg-green-100 text-green-700 hover:bg-green-200 border-none font-bold" :
                                            (item.similarity * 100) > 60 ? "bg-blue-100 text-[#1877F2] hover:bg-blue-200 border-none font-bold" :
                                                "bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-bold"
                                    }
                                >
                                    {Math.round(item.similarity * 100)}% Match
                                </Badge>
                            </div>
                            <CardTitle className="text-xl">Hidden Item</CardTitle>
                            <CardDescription className="flex flex-col gap-1 mt-1 text-sm">
                                <span>{item.subcategory}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="mt-auto pt-0">
                            <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-none">
                                <Link href={`/lost/claim/${item.id}`}>
                                    Claim & Verify
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* If No Results */}
            {results.length === 0 && (
                <div className="text-center py-20 bg-slate-50 border border-slate-200 rounded-2xl border-dashed">
                    <div className="w-16 h-16 bg-white text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No High-Confidence Matches</h3>
                    <p className="text-slate-600 max-w-md mx-auto mb-6 text-sm">
                        We couldn't find a strong match right now. Don't worry, we'll keep scanning new reported items and notify you automatically if something turns up.
                    </p>
                    <Button variant="outline" className="bg-white">
                        Set up Email Alert
                    </Button>
                </div>
            )}
        </div>
    )
}

export default function LostResultsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        }>
            <ResultsContent />
        </Suspense>
    );
}
