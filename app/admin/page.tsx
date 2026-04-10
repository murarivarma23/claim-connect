import { BarChart3, Users, ShieldAlert, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AdminDashboardPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full flex flex-col md:flex-row gap-8">
            {/* Sidebar Admin Navigation */}
            <aside className="w-full md:w-64 shrink-0 space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-6 pl-2">Institution Admin</h2>
                <nav className="flex flex-col gap-1">
                    <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-900 text-white font-medium">
                        <BarChart3 className="w-4 h-4" />
                        Overview
                    </a>
                    <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium">
                        <ShieldAlert className="w-4 h-4" />
                        Fraud Logs
                    </a>
                    <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium">
                        <Users className="w-4 h-4" />
                        Trust Scores
                    </a>
                </nav>
            </aside>

            {/* Main Dashboard Content */}
            <div className="flex-1 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Analytics</h1>
                    <p className="text-slate-500 mt-1">Real-time metrics for your institution's lost and found operations.</p>
                </div>

                {/* Top Stat Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Items Recovered</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">1,248</div>
                            <p className="text-xs text-green-600 flex items-center font-medium mt-1">
                                <ArrowUpRight className="mr-1 h-3 w-3" />
                                +14.5% from last month
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Fraud Prevented</CardTitle>
                            <ShieldAlert className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">342</div>
                            <p className="text-xs text-green-600 flex items-center font-medium mt-1">
                                <ArrowDownRight className="mr-1 h-3 w-3" />
                                -2.4% false claims
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Recovery Time</CardTitle>
                            <BarChart3 className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">4.2 hrs</div>
                            <p className="text-xs text-slate-500 mt-1">
                                Industry avg: 5.4 days
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <Users className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">8,231</div>
                            <p className="text-xs text-green-600 flex items-center font-medium mt-1">
                                <ArrowUpRight className="mr-1 h-3 w-3" />
                                +112 new this week
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Analytics Section */}
                <div className="grid lg:grid-cols-2 gap-8">
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Recent Activity Stream</CardTitle>
                            <CardDescription>Live updates from the AI mediation engine.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Item Successfully Claimed</p>
                                        <p className="text-sm text-slate-500">Student verified ownership of <span className="font-medium text-slate-700">Apple AirPods</span> with 98% AI confidence match.</p>
                                        <p className="text-xs text-slate-400 mt-1">2 mins ago</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Suspicious Claim Blocked</p>
                                        <p className="text-sm text-slate-500">User attempted to claim <span className="font-medium text-slate-700">Leather Wallet</span> but failed multi-layer verification (12% match).</p>
                                        <p className="text-xs text-slate-400 mt-1">15 mins ago</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                        <Users className="w-4 h-4 text-[#1877F2]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">New Item Ingested</p>
                                        <p className="text-sm text-slate-500">AI categorized new uploaded item as <span className="font-medium text-slate-700">Textbooks / Academics</span> and generated security questions.</p>
                                        <p className="text-xs text-slate-400 mt-1">1 hour ago</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Flagged Users (Low Trust Score)</CardTitle>
                            <CardDescription>Accounts with repeated rejected claims requiring review.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { id: 'USR-8921', attempts: 4, score: 12 },
                                    { id: 'USR-3214', attempts: 3, score: 28 },
                                    { id: 'USR-9932', attempts: 3, score: 34 },
                                ].map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50">
                                        <div>
                                            <p className="font-medium text-slate-900">{user.id}</p>
                                            <p className="text-xs text-slate-500">{user.attempts} failed claims</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-none">
                                                Score: {user.score}/100
                                            </Badge>
                                            <button className="text-xs text-[#1877F2] font-medium hover:underline">Review Details</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
