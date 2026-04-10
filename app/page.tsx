import Link from 'next/link';
import { Search, Mic, ArrowRight, ShieldCheck, CheckCircle2, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="w-full flex flex-col items-center">

      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 flex flex-col items-center text-center">
        {/* AI Badge */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/50 text-blue-500 font-medium text-sm border border-blue-100">
            <ShieldCheck className="w-4 h-4" />
            AI-Powered Trust Recovery
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6 font-sans">
          Lost & Found, <span className="text-blue-600">Reimagined with<br className="hidden md:block" /> Trust.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed mb-16">
          The world's first agentic recovery platform. AI verifies ownership, prevents fraud, and connects finders with rightful owners — securely and intelligently.
        </p>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl mb-16">
          {/* Lost Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-10 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">I Lost Something</h2>
            <p className="text-slate-500 mb-8 max-w-sm px-4">
              Describe your item and let our AI find matches with semantic search and ownership verification.
            </p>
            <Button asChild size="lg" className="w-full mt-auto bg-blue-500 hover:bg-blue-600 text-white font-medium py-6 text-base rounded-xl">
              <Link href="/lost">
                Start Recovery <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Found Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-10 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-slate-900" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">I Found Something</h2>
            <p className="text-slate-500 mb-8 max-w-sm px-4">
              Upload a photo and our AI will catalogue it, extract features, and generate verification questions.
            </p>
            <Button asChild variant="outline" size="lg" className="w-full mt-auto bg-white border-slate-200 text-slate-900 hover:bg-slate-50 font-medium py-6 text-base rounded-xl">
              <Link href="/found">
                Report Found Item <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <form action="/lost/results" method="GET" className="w-full max-w-3xl relative mx-auto drop-shadow-sm">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <Input
            type="text"
            name="q"
            placeholder="Describe what you lost (e.g., 'Vintage leather wallet with initials J.K.')"
            className="w-full pl-14 pr-36 py-8 rounded-full border-slate-200 bg-white text-slate-900 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 text-base shadow-sm placeholder:text-slate-400 border"
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-2">
            <button type="button" className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-5 h-auto font-medium shadow-none">
              Search
            </Button>
          </div>
        </form>
      </section>

      {/* How it Works Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How ClaimConnect Works</h2>
          <p className="text-lg text-slate-500">Four intelligent steps to recover what's yours</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 relative pt-12 shadow-sm hover:shadow-md transition-all">
            <div className="absolute -top-4 right-8 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shadow-sm">1</div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <Eye className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">AI Extraction</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Upload a photo. Gemini AI extracts category, brand, color, and unique attributes automatically.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 relative pt-12 shadow-sm hover:shadow-md transition-all">
            <div className="absolute -top-4 right-8 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shadow-sm">2</div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <Search className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Semantic Search</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Describe your lost item in plain language. Our vector search finds matches beyond keywords.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 relative pt-12 shadow-sm hover:shadow-md transition-all">
            <div className="absolute -top-4 right-8 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shadow-sm">3</div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Layer Verification</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Answer AI-generated questions only the true owner would know. Three verification layers prevent fraud.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 relative pt-12 shadow-sm hover:shadow-md transition-all">
            <div className="absolute -top-4 right-8 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shadow-sm">4</div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Secure Handover</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Verified owners connect via AI-mediated chat. Trust scores update after successful returns.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
