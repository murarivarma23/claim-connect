"use client"

import Link from 'next/link'
import { useState } from 'react'
import { ShieldCheck, Mail, Lock, User, Building, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function SignupPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.message || 'Something went wrong during registration.')
                setIsLoading(false)
                return
            }

            // Immediately sign the user in after successful registration
            const signInRes = await signIn('credentials', {
                email,
                password,
                redirect: false
            })

            if (signInRes?.error) {
                setError('Account created, but could not log in automatically. Please log in manually.')
                setIsLoading(false)
            } else if (signInRes?.ok) {
                router.push('/profile')
                router.refresh()
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
            setIsLoading(false)
        }
    }



    return (
        <div className="flex-1 w-full flex items-center justify-center py-12 px-4 bg-slate-50">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10 p-6 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-[#1877F2] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-white">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Create an Account</h1>
                    <p className="text-slate-500">Join the secure network for finding lost items.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                className="pl-9 bg-slate-50 focus-visible:ring-[#1877F2]"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="institution">Institution / University</Label>
                        <div className="relative">
                            <Building className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                id="institution"
                                name="institution"
                                type="text"
                                placeholder="e.g. VIT University"
                                className="pl-9 bg-slate-50 focus-visible:ring-[#1877F2]"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Institution Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="student@university.edu"
                                className="pl-9 bg-slate-50 focus-visible:ring-[#1877F2]"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className="pl-9 bg-slate-50 focus-visible:ring-[#1877F2]"
                                required
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters.</p>
                    </div>

                    <Button type="submit" className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white shadow-sm py-6 text-base mt-2" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Account...
                            </>
                        ) : "Create Account"}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-600">
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold text-[#1877F2] hover:text-[#1877F2] hover:underline">
                        Log in instead
                    </Link>
                </div>
            </div>
        </div>
    )
}
