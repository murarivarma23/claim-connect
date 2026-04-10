"use client"

import Link from 'next/link'
import { useState } from 'react'
import { ShieldCheck, Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false
            })

            if (res?.error) {
                setError('Invalid email or password.')
                setIsLoading(false)
            } else if (res?.ok) {
                router.push('/profile')
                router.refresh()
            }
        } catch (err) {
            setError('Something went wrong. Please try again.')
            setIsLoading(false)
        }
    }



    return (
        <div className="flex-1 w-full flex items-center justify-center p-4 bg-slate-50">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10 p-6 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-[#1877F2] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-white">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h1>
                    <p className="text-slate-500">Log in to manage your items & track trust scores.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
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
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <a href="#" className="text-xs font-medium text-[#1877F2] hover:text-[#1877F2]">Forgot password?</a>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                className="pl-9 bg-slate-50 focus-visible:ring-[#1877F2]"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white shadow-sm py-6 text-base" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Authenticating...
                            </>
                        ) : "Sign In to Account"}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-600">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-semibold text-[#1877F2] hover:text-[#1877F2] hover:underline">
                        Sign up securely
                    </Link>
                </div>
            </div>
        </div>
    )
}
