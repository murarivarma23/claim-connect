import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into Supabase custom table
        const { data, error } = await supabase
            .from('users')
            .insert([
                { name, email, password_hash: hashedPassword }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ message: 'User created successfully', user: data }, { status: 201 });
    } catch (error) {
        console.error('Registration Error:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
