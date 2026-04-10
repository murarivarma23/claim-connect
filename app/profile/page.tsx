import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { DeleteItemButton } from "@/components/delete-item-button"

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect('/login?callbackUrl=/profile');
    }

    const { data: foundItems } = await supabase
        .from('items')
        .select('*')
        .eq('finder_id', (session.user as any).id)
        .order('id', { ascending: false });

    const { data: myClaims } = await supabase
        .from('claims')
        .select('*, items(id, category, subcategory, location_found, image_url, time_found)')
        .eq('claimer_id', (session.user as any).id)
        .order('created_at', { ascending: false });

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">User Dashboard</h1>
                <p className="text-slate-600">Manage your reported findings, active claims, and security metrics.</p>
            </div>

            <Tabs defaultValue="found" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-sm mb-8">
                    <TabsTrigger value="found">My Found Items</TabsTrigger>
                    <TabsTrigger value="claims">My Claims</TabsTrigger>
                </TabsList>

                <TabsContent value="found" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {foundItems && foundItems.length > 0 ? (
                            foundItems.map((item) => (
                                <Dialog key={item.id}>
                                    <DialogTrigger asChild>
                                        <Card className="cursor-pointer hover:border-blue-300 hover:shadow-md transition-all">
                                            <div className="aspect-video bg-slate-100 rounded-t-xl flex items-center justify-center text-slate-400 overflow-hidden relative">
                                                {item.image_url && item.image_url.startsWith('data:') ? (
                                                    <img src={item.image_url} alt="Item" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>[Image Placeholder]</span>
                                                )}
                                            </div>
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start mb-1">
                                                    <Badge variant="secondary">{item.category || 'Processing...'}</Badge>
                                                    <span className="text-xs text-slate-500">
                                                        {new Date(item.time_found).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <CardTitle className="text-lg">{item.subcategory || 'Identifying item...'}</CardTitle>
                                                <CardDescription>Found in {item.location_found || 'Unknown'}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center justify-between text-sm mt-2">
                                                    <span className="text-slate-500">Status:</span>
                                                    <Badge className={`border-none ${item.status === 'processing' || item.status === 'analyzing_image' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                        {item.status.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-xl">
                                        <DialogHeader>
                                            <DialogTitle>{item.subcategory || item.category || 'Item Details'}</DialogTitle>
                                            <DialogDescription>
                                                Full details extracted by AI and your provided context.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                            <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                                {item.image_url && item.image_url.startsWith('data:') ? (
                                                    <img src={item.image_url} alt="Item" className="w-full h-auto object-cover" />
                                                ) : (
                                                    <div className="aspect-square flex items-center justify-center text-slate-400">No Image</div>
                                                )}
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-sm font-medium text-slate-500">Status</h4>
                                                    <Badge className={`mt-1 border-none ${item.status === 'processing' || item.status === 'analyzing_image' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                        {item.status.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-slate-500">Found Location</h4>
                                                    <p className="text-slate-900 mt-1">{item.location_found || 'Not specified'}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-slate-500">Time Found</h4>
                                                    <p className="text-slate-900 mt-1">{new Date(item.time_found).toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-slate-500 mb-1">AI Semantic Extracted Details</h4>
                                                    <ul className="text-sm text-slate-700 space-y-1">
                                                        <li><span className="font-medium text-slate-900">Category:</span> {item.category || 'TBD'}</li>
                                                        <li><span className="font-medium text-slate-900">Subcategory:</span> {item.subcategory || 'TBD'}</li>
                                                        {item.color && <li><span className="font-medium text-slate-900">Color:</span> {item.color}</li>}
                                                        {item.brand && <li><span className="font-medium text-slate-900">Brand:</span> {item.brand}</li>}
                                                    </ul>
                                                </div>
                                                {item.ai_item_description && (
                                                    <div>
                                                        <h4 className="text-sm font-medium text-slate-500 mb-1">AI Semantic Extracted Description</h4>
                                                        <p className="text-sm text-slate-700 bg-white p-3 rounded-md border border-slate-200 mt-1">
                                                            {item.ai_item_description}
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="pt-2 border-t border-slate-200 mt-4">
                                                    <DeleteItemButton itemId={item.id} />
                                                </div>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-10 text-slate-500">
                                You haven't reported any found items yet.
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="claims" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {myClaims && myClaims.length > 0 ? (
                            myClaims.map((claim) => (
                                <Card key={claim.id}>
                                    <div className="aspect-video bg-slate-100 rounded-t-xl flex items-center justify-center text-slate-400 overflow-hidden relative">
                                        {claim.items?.image_url && claim.items?.image_url.startsWith('data:') ? (
                                            <img src={claim.items.image_url} alt="Item" className={`w-full h-full object-cover ${claim.status === 'pending' ? 'blur-md' : ''}`} />
                                        ) : (
                                            <span>[Image]</span>
                                        )}
                                    </div>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start mb-1">
                                            <Badge variant="secondary">{claim.items?.category || 'Item'}</Badge>
                                            <span className="text-xs text-slate-500">
                                                {new Date(claim.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <CardTitle className="text-lg">{claim.items?.subcategory || 'Claimed Item'}</CardTitle>
                                        <CardDescription>
                                            Status: <span className="font-semibold capitalize">{claim.status}</span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm mt-2">
                                            <span className="text-slate-500">AI Match Score:</span>
                                            <span className="font-semibold text-[#1877F2]">
                                                {claim.ai_confidence_score ? `${claim.ai_confidence_score}% Match` : 'Processing...'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-10 text-slate-500">
                                You have not claimed any items yet.
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
