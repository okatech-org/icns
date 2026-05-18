import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, Shield, UserCog, RefreshCw } from 'lucide-react';
import { IASTED_AUTHORIZED_ROLES, type AppRole } from '@/config/role-contexts';

interface AdminUser {
    id: string;
    email: string;
    last_sign_in_at: string;
    created_at: string;
    roles: AppRole[];
    user_metadata: any;
}

export const UserManagementSection = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
    const [editingRoles, setEditingRoles] = useState<AppRole[]>([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('admin-users');
            if (error) throw error;
            setUsers(data.users);
        } catch (error: any) {
            console.error('Error fetching users:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger la liste des utilisateurs",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditRoles = (user: AdminUser) => {
        setSelectedUser(user);
        setEditingRoles(user.roles);
        setIsEditRoleOpen(true);
    };

    const saveRoles = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            // 1. Remove all existing roles
            const { error: deleteError } = await supabase
                .from('user_roles')
                .delete()
                .eq('user_id', selectedUser.id);

            if (deleteError) throw deleteError;

            // 2. Add new roles
            if (editingRoles.length > 0) {
                const { error: insertError } = await supabase
                    .from('user_roles')
                    .insert(editingRoles.map(role => ({
                        user_id: selectedUser.id,
                        role: role
                    })));

                if (insertError) throw insertError;
            }

            toast({
                title: "Succès",
                description: "Rôles mis à jour"
            });
            setIsEditRoleOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = (role: AppRole) => {
        if (editingRoles.includes(role)) {
            setEditingRoles(editingRoles.filter(r => r !== role));
        } else {
            setEditingRoles([...editingRoles, role]);
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_metadata?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Gestion des Utilisateurs</h2>
                    <p className="text-muted-foreground">
                        Gérez les comptes, les rôles et les permissions.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 w-[250px]"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchUsers}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Rôles</TableHead>
                                <TableHead>Dernière connexion</TableHead>
                                <TableHead>Créé le</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Aucun utilisateur trouvé.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.user_metadata?.full_name || 'Sans nom'}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles.map(role => (
                                                    <Badge key={role} variant="secondary" className="text-[10px]">
                                                        {role}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Jamais'}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditRoles(user)}
                                            >
                                                <UserCog className="h-4 w-4 mr-2" /> Gérer
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Modifier les rôles</DialogTitle>
                        <CardDescription>
                            Sélectionnez les rôles pour {selectedUser?.email}
                        </CardDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-2 border p-4 rounded-md max-h-[300px] overflow-y-auto">
                            {IASTED_AUTHORIZED_ROLES.map(role => (
                                <div key={role} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`edit-role-${role}`}
                                        checked={editingRoles.includes(role)}
                                        onCheckedChange={() => toggleRole(role)}
                                    />
                                    <label
                                        htmlFor={`edit-role-${role}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        {role}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>Annuler</Button>
                        <Button onClick={saveRoles} disabled={loading}>
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
