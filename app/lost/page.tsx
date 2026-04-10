"use client"

import { useState, useRef } from 'react'
import { Search, Mic, UploadCloud, Loader2, FileImage } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useRouter } from 'next/navigation'

export default function LostItemPage() {
    const [isSearching, setIsSearching] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSearching(true)

        try {
            const queryStr = (document.getElementById('query') as HTMLInputElement).value;

            // Navigate directly to the results page, passing the user query in the URL
            router.push(`/lost/results?q=${encodeURIComponent(queryStr)}`);
        } catch (err: any) {
            console.error(err);
            alert(`Error navigating to results.`);
            setIsSearching(false);
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
        }
    };

    return (
        <div className="w-full flex-1 flex flex-col items-center pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full text-center mb-10">
                <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Find Your Lost Item</h1>
                <p className="text-lg text-slate-500">
                    Describe what you lost in detail. Our AI will perform a semantic search across all registered items.
                </p>
            </div>

            <div className="w-full max-w-3xl mb-8">
                <form onSubmit={handleSearch} className="relative flex items-center w-full drop-shadow-sm">
                    <div className="absolute left-6 text-slate-400 pointer-events-none">
                        <Search className="w-5 h-5" />
                    </div>

                    <Input
                        id="query"
                        type="text"
                        placeholder="e.g., Black Sony earbuds with a cracked charging case..."
                        className="w-full pl-14 pr-36 py-8 rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 text-base placeholder:text-slate-400"
                        required
                        disabled={isSearching}
                    />

                    <div className="absolute right-3 flex items-center gap-2">
                        <button type="button" className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <Mic className="w-5 h-5" />
                        </button>
                        <Button type="submit" disabled={isSearching} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-8 py-5 h-auto font-medium shadow-none h-12">
                            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
                        </Button>
                    </div>
                </form>
            </div>

            <div className="text-center mb-16">
                <p className="text-slate-500 mb-4 text-[15px]">upload an image of the lost item</p>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium px-8 py-7 text-lg rounded-xl shadow-sm gap-3"
                >
                    {selectedImage ? (
                        <>
                            <FileImage className="w-6 h-6 text-blue-500" />
                            {selectedImage.name}
                        </>
                    ) : (
                        <>
                            <UploadCloud className="w-6 h-6" />
                            Upload Image
                        </>
                    )}
                </Button>
            </div>

            <div className="w-full max-w-4xl">
                <h3 className="text-center text-xl font-extrabold text-slate-900 mb-8">Tips for better results</h3>

                <div className="grid sm:grid-cols-2 gap-4">
                    {/* Tip 1 */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-start gap-4">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</div>
                        <p className="text-slate-600 text-md leading-relaxed">Be specific about brand, color, and condition</p>
                    </div>
                    {/* Tip 2 */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-start gap-4">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</div>
                        <p className="text-slate-600 text-md leading-relaxed">Mention distinguishing marks or damage</p>
                    </div>
                    {/* Tip 3 */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-start gap-4">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</div>
                        <p className="text-slate-600 text-md leading-relaxed">Include the approximate location you lost it</p>
                    </div>
                    {/* Tip 4 */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-start gap-4">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">4</div>
                        <p className="text-slate-600 text-md leading-relaxed">Describe any case, cover, or accessories</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
