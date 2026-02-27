import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, UserPlus, MoreVertical, Trash2, Mail, Shield, User as UserIcon, Check, X } from "lucide-react";
import { formatPlatformDate } from "@/lib/utils";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";

export default function AdminUsers() {
    const { toast } = useToast();
    const { token } = useAuth();
    const { safeMutation } = useSafeMutation();
    const users = useQuery(api.users.list, { token: token || undefined }) || [];
    const removeUser = useMutation(api.users.remove);
    const upsertUser = useMutation(api.users.upsert);

    const [search, setSearch] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    // New User State
    const [newEmail, setNewEmail] = useState("");
    const [newName, setNewName] = useState("");
    const [newRole, setNewRole] = useState<"admin" | "user">("user");
    const [isSub, setIsSub] = useState(true);

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.name?.toLowerCase().includes(search.toLowerCase())
        );
    }, [users, search]);

    const handleAddUser = async () => {
        if (!newEmail) return;
        await safeMutation(upsertUser, {
            token: token || undefined,
            email: newEmail,
            name: newName || undefined,
            role: newRole,
            isSubscriber: isSub,
        }, "User added");
        setIsAdding(false);
        setNewEmail("");
        setNewName("");
    };

    const handleDelete = async (id: any) => {
        if (confirm("Are you sure you want to delete this user?")) {
            await safeMutation(removeUser, { id, token: token || undefined }, "User deleted");
        }
    };

    return (
        <div className="space-y-6 p-6 bg-white min-h-screen">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                        <UserIcon className="h-8 w-8 text-indigo-600" /> Users & Subscribers
                    </h1>
                    <p className="text-zinc-500 text-sm">Manage user roles and newsletter subscriptions.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800">
                    <UserPlus className="h-4 w-4" />
                    Add User
                </Button>
            </div>

            {isAdding && (
                <Card className="border-indigo-100 bg-indigo-50/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Quick Add User</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <Label className="text-[10px] uppercase text-zinc-500 font-bold">Email</Label>
                            <Input placeholder="user@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="h-9 bg-white" />
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <Label className="text-[10px] uppercase text-zinc-500 font-bold">Name</Label>
                            <Input placeholder="John Doe" value={newName} onChange={e => setNewName(e.target.value)} className="h-9 bg-white" />
                        </div>
                        <div className="space-y-1.5 min-w-[120px]">
                            <Label className="text-[10px] uppercase text-zinc-500 font-bold">Role</Label>
                            <select
                                className="w-full h-9 rounded-md border border-input bg-white px-3 text-sm"
                                value={newRole}
                                onChange={e => setNewRole(e.target.value as any)}
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 h-9 mb-1">
                            <input type="checkbox" checked={isSub} onChange={e => setIsSub(e.target.checked)} id="isSub" />
                            <Label htmlFor="isSub" className="text-xs">Subscribe to Mail</Label>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleAddUser} size="sm" className="bg-indigo-600">Add</Button>
                            <Button onClick={() => setIsAdding(false)} variant="ghost" size="sm">Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-zinc-200">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="relative w-72">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Search by email or name..."
                                className="pl-8 h-9 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-400">
                            <span>{filteredUsers.length} total users</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-200">
                                    <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">User</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Role</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Subscription</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Joined</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user._id} className="border-zinc-100 hover:bg-zinc-50 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-zinc-900">{user.name || "Anonymous"}</span>
                                                <span className="text-xs text-zinc-500 font-medium">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === "admin" ? "default" : "secondary"} className={`text-[10px] font-black uppercase tracking-widest ${user.role === "admin" ? "bg-indigo-600" : "bg-zinc-100 text-zinc-600"}`}>
                                                {user.role === "admin" ? <Shield className="h-3 w-3 mr-1" /> : <UserIcon className="h-3 w-3 mr-1" />}
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.isSubscriber ? (
                                                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-[10px] font-black uppercase tracking-tighter gap-1">
                                                    <Check className="h-3 w-3" /> Subscribed
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-zinc-400 border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-tighter gap-1">
                                                    <X className="h-3 w-3" /> Opted Out
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-zinc-500 font-medium font-mono">
                                            {formatPlatformDate(user.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-zinc-100">
                                                        <MoreVertical className="h-4 w-4 text-zinc-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 shadow-xl border-zinc-200">
                                                    <DropdownMenuItem
                                                        onClick={() => upsertUser({
                                                            token: token || undefined,
                                                            id: user._id,
                                                            email: user.email,
                                                            role: user.role === "admin" ? "user" : "admin",
                                                            isSubscriber: user.isSubscriber
                                                        })}
                                                        className="gap-2 font-medium"
                                                    >
                                                        <Shield className="h-4 w-4" />
                                                        Toggle Admin Role
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => upsertUser({
                                                            token: token || undefined,
                                                            id: user._id,
                                                            email: user.email,
                                                            role: user.role,
                                                            isSubscriber: !user.isSubscriber
                                                        })}
                                                        className="gap-2 font-medium"
                                                    >
                                                        <Mail className="h-4 w-4" />
                                                        {user.isSubscriber ? "Unsubscribe User" : "Subscribe to Mail"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-rose-600 gap-2 font-medium" onClick={() => handleDelete(user._id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="sm:hidden divide-y divide-zinc-100 -mx-6">
                        {filteredUsers.map((user) => (
                            <div key={user._id} className="p-4 space-y-3 hover:bg-zinc-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                                            <UserIcon className="h-5 w-5 text-zinc-400" />
                                        </div>
                                        <div className="space-y-0.5 min-w-0">
                                            <p className="text-sm font-black text-zinc-900 truncate pr-2">{user.name || "Anonymous"}</p>
                                            <p className="text-[10px] text-zinc-500 font-medium truncate pr-2">{user.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant={user.role === "admin" ? "default" : "secondary"} className={`text-[8px] font-black uppercase tracking-widest shrink-0 ${user.role === "admin" ? "bg-indigo-600" : "bg-zinc-100 text-zinc-500"}`}>
                                        {user.role === "admin" ? <Shield className="h-2 w-2 mr-1" /> : null}
                                        {user.role}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-100">
                                    <div className="flex items-center gap-2">
                                        {user.isSubscriber ? (
                                            <div className="flex items-center gap-1.5 text-emerald-600">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-black uppercase tracking-tighter">Subscribed</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-zinc-400">
                                                <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                                                <span className="text-[10px] font-black uppercase tracking-tighter">Opted Out</span>
                                            </div>
                                        )}
                                        <span className="text-zinc-300">|</span>
                                        <span className="text-[9px] text-zinc-400 font-mono">{formatPlatformDate(user.createdAt)}</span>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-zinc-200 rounded-full">
                                                <MoreVertical className="h-3 w-3 text-zinc-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 shadow-xl border-zinc-200">
                                            <DropdownMenuItem
                                                onClick={() => upsertUser({
                                                    token: token || undefined,
                                                    id: user._id,
                                                    email: user.email,
                                                    role: user.role === "admin" ? "user" : "admin",
                                                    isSubscriber: user.isSubscriber
                                                })}
                                                className="gap-2 font-medium"
                                            >
                                                <Shield className="h-4 w-4" />
                                                Toggle Admin Role
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => upsertUser({
                                                    token: token || undefined,
                                                    id: user._id,
                                                    email: user.email,
                                                    role: user.role,
                                                    isSubscriber: !user.isSubscriber
                                                })}
                                                className="gap-2 font-medium"
                                            >
                                                <Mail className="h-4 w-4" />
                                                {user.isSubscriber ? "Unsubscribe User" : "Subscribe to Mail"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-rose-600 gap-2 font-medium" onClick={() => handleDelete(user._id)}>
                                                <Trash2 className="h-4 w-4" />
                                                Delete User
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredUsers.length === 0 && (
                        <div className="text-center text-zinc-400 py-12 border-t border-zinc-100">
                            No users found
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function Label({ children, className, ...props }: any) {
    return <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>{children}</label>;
}
