import { validateRequest } from "@/lib/auth";

export default async function AdminHome() {
    const { user } = await validateRequest();

    if (!user || user.role !== "admin") {
        return <div>You do not have permission to access this page</div>;
    }

    return (
        <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome, {user.username}!</p>
        </div>
    )
}