import Link from 'next/link';
import { Eye, Search, ShieldCheck, MessageSquare, Upload, Sparkles, Lock, CheckCircle2, Users, BrainCircuit, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HowItWorksPage() {
    return (
        <div className="w-full flex justify-center py-20 px-4 sm:px-6 lg:px-8 bg-white min-h-screen">
            <div className="max-w-4xl w-full">

                {/* Header Content */}
                <div className="text-center mb-24">
                    <div className="mb-8">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/50 text-blue-500 font-medium text-sm border border-blue-100">
                            <Activity className="w-4 h-4" />
                            The Workflow
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.2] mb-6">
                        How ClaimConnect Works
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        A four-phase, AI-driven workflow that takes a found item from discovery to verified handover — with fraud prevention at every step.
                    </p>
                </div>

                {/* Phase 1 */}
                <div className="mb-24 relative">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-none">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm">
                                <Eye className="w-8 h-8 text-blue-500" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-blue-500 tracking-wider uppercase mb-2">Phase 1</h4>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Item Discovery & AI Extraction</h2>
                                <p className="text-slate-500 text-lg">The Finder reports a found item</p>
                            </div>

                            {/* Timeline list */}
                            <div className="relative border-l-2 border-slate-100 ml-3 md:ml-0 pl-8 space-y-12">
                                <div className="relative">
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                                    <div className="flex gap-4 items-start">
                                        <Upload className="w-6 h-6 text-slate-400 shrink-0" />
                                        <p className="text-slate-700 leading-relaxed pt-0.5">Finder uploads photos of the found item to ClaimConnect.</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                                    <div className="flex gap-4 items-start">
                                        <Sparkles className="w-6 h-6 text-slate-400 shrink-0" />
                                        <p className="text-slate-700 leading-relaxed pt-0.5">Our Gemini AI vision model analyzes the images — extracting category, brand, color, condition, and unique attributes.</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                                    <div className="flex gap-4 items-start">
                                        <ShieldCheck className="w-6 h-6 text-slate-400 shrink-0" />
                                        <p className="text-slate-700 leading-relaxed pt-0.5">AI generates dynamic verification questions that only the true owner could answer (e.g., 'What sticker is on the laptop lid?').</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                                    <div className="flex gap-4 items-start">
                                        <Lock className="w-6 h-6 text-slate-400 shrink-0" />
                                        <p className="text-slate-700 leading-relaxed pt-0.5">The item is catalogued with blurred images and hidden sensitive details — ready for claim matching.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phase 2 */}
                <div className="mb-24 relative">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-none">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm">
                                <Search className="w-8 h-8 text-blue-500" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-blue-500 tracking-wider uppercase mb-2">Phase 2</h4>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Semantic Search & Matching</h2>
                                <p className="text-slate-500 text-lg">The Claimer describes their lost item</p>
                            </div>

                            {/* Timeline list */}
                            <div className="relative border-l-2 border-slate-100 ml-3 md:ml-0 pl-8 space-y-12">
                                <div className="relative">
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                                    <div className="flex gap-4 items-start">
                                        <Search className="w-6 h-6 text-slate-400 shrink-0" />
                                        <p className="text-slate-700 leading-relaxed pt-0.5">Claimer describes their lost item in natural language: 'Black leather wallet with red stitching and my university ID inside.'</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                                    <div className="flex gap-4 items-start">
                                        <BrainCircuit className="w-6 h-6 text-slate-400 shrink-0" />
                                        <p className="text-slate-700 leading-relaxed pt-0.5">Our vector search engine matches this description against all catalogued items using semantic similarity — going far beyond keywords.</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                                    <div className="flex gap-4 items-start">
                                        <Eye className="w-6 h-6 text-slate-400 shrink-0" />
                                        <p className="text-slate-700 leading-relaxed pt-0.5">Results are shown as blurred cards: only the AI confidence score, general category, and broad location are visible to prevent gaming.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phase 3 */}
                <div className="mb-24 relative">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-none">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm">
                                <ShieldCheck className="w-8 h-8 text-blue-500" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-blue-500 tracking-wider uppercase mb-2">Phase 3</h4>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Multi-Layer Ownership Verification</h2>
                                <p className="text-slate-500 text-lg">Three verification layers prevent fraud</p>
                            </div>

                            {/* Timeline list */}
                            <div className="relative border-l-2 border-slate-100 ml-3 md:ml-0 pl-8 space-y-12">
                                <div className="relative">
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                                    <div className="flex gap-4 items-start">
                                        <CheckCircle2 className="w-6 h-6 text-slate-400 shrink-0" />
                                        <p className="text-slate-700 leading-relaxed pt-0.5">Layer 1 — Semantic Similarity: The AI compares the claimer's description with the finder's description using vector embeddings.</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                                    <div className="flex gap-4 items-start">
                                        <CheckCircle2 className="w-6 h-6 text-slate-400 shrink-0" />
                                        <p className="text-slate-700 leading-relaxed pt-0.5">Layer 2 — Attribute Cross-Matching: The claimer answers AI-generated questions. Answers are compared against the hidden extracted attributes.</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                                    <div className="flex gap-4 items-start">
                                        <CheckCircle2 className="w-6 h-6 text-slate-400 shrink-0" />
                                        <p className="text-slate-700 leading-relaxed pt-0.5">Layer 3 — Contextual Consistency: AI checks time, location, and behavioral plausibility of the claim (e.g., was the claimer in the area?).</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                                    <div className="flex gap-4 items-start">
                                        <BrainCircuit className="w-6 h-6 text-slate-400 shrink-0" />
                                        <p className="text-slate-700 leading-relaxed pt-0.5">A composite Trust Score is computed. Claims below the threshold are flagged; high-score claims proceed to mediation.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phase 4 */}
                <div className="mb-24 relative">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-none">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm">
                                <MessageSquare className="w-8 h-8 text-blue-500" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-blue-500 tracking-wider uppercase mb-2">Phase 4</h4>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">AI-Mediated Secure Handover</h2>
                                <p className="text-slate-500 text-lg">Verified owners connect safely</p>
                            </div>

                            {/* Timeline list */}
                            <div className="relative border-l-2 border-slate-100 ml-3 md:ml-0 pl-8 space-y-12">
                                <div className="relative">
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                                    <div className="flex gap-4 items-start">
                                        <Users className="w-6 h-6 text-slate-400 shrink-0" />
                                        <p className="text-slate-700 leading-relaxed pt-0.5">Verified claimers and finders are connected via an AI-mediated chat channel.</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                                    <div className="flex gap-4 items-start">
                                        <BrainCircuit className="w-6 h-6 text-slate-400 shrink-0" />
                                        <p className="text-slate-700 leading-relaxed pt-0.5">A silent AI agent monitors the conversation in real-time, flagging inconsistencies or suspicious behavior with colored system alerts.</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                                    <div className="flex gap-4 items-start">
                                        <ShieldCheck className="w-6 h-6 text-slate-400 shrink-0" />
                                        <p className="text-slate-700 leading-relaxed pt-0.5">Upon successful handover, both users' Trust Scores are updated — building a reputation system that rewards honesty.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="text-center pt-8 border-t border-slate-100">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to get started?</h2>
                    <p className="text-lg text-slate-500 mb-8 max-w-lg mx-auto">
                        Whether you've lost or found something, ClaimConnect has you covered.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg" className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-8 py-6 rounded-xl text-base">
                            <Link href="/lost">I Lost Something</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium px-8 py-6 rounded-xl text-base">
                            <Link href="/found">I Found Something</Link>
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
