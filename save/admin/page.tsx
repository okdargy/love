import { validateRequest } from "@/lib/auth";
import EditItem from "./components/EditItem";
import ItemList from "./components/ItemList";

export default async function AdminHome() {
    const { user } = await validateRequest();

    if (!user || user.role !== "admin") {
        return <div>You do not have permission to access this page</div>;
    }

    return (
        <div className="p-3 space-y-2">
            <div>
                <h1>Admin Dashboard</h1>
                <p>Welcome, {user.username}!</p>
            </div>
            
            <ItemList />
        </div>
    );
}