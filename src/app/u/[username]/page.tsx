"use server"

import { redirect, notFound } from 'next/navigation';

export default async function Page(props: { params: Promise<{ username: string }> }) {
    const params = await props.params;
    let redirectPath: string | null = null

    if (!params.username) {
        return notFound();
    }

    try {
        const response = await fetch(`https://api.polytoria.com/v1/users/find?username=${params.username}`);
        if (response.status === 200) {
            const data = await response.json();
            redirectPath = `/users/${data.id}`;
        } else if (response.status === 404) {
            return notFound();
        } else {
            console.error('Unexpected error:', response.status);
            return notFound();
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        return notFound();
    } finally {
        if (redirectPath) {
            redirect(redirectPath);
        }
    }
}