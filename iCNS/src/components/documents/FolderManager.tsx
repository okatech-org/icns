import { Folder, FolderOpen, Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Database } from '@/integrations/supabase/types';

type Folder = Database['public']['Tables']['document_folders']['Row'];

interface FolderManagerProps {
    folders: Folder[];
    onFolderSelect: (folderId: string | null) => void;
    selectedFolderId: string | null;
    userRole: string;
}

export function FolderManager({
    folders,
    onFolderSelect,
    selectedFolderId,
    userRole
}: FolderManagerProps) {
    return (
        <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Mes Dossiers
            </div>

            {folders.map((folder) => {
                const isSelected = folder.id === selectedFolderId;
                const IconComponent = isSelected ? FolderOpen : Folder;

                return (
                    <div
                        key={folder.id}
                        className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all ${isSelected
                                ? 'neu-inset text-primary font-semibold'
                                : 'neu-raised hover:shadow-neo-md'
                            }`}
                        onClick={() => onFolderSelect(folder.id)}
                    >
                        <span className="text-lg">{folder.icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{folder.name}</p>
                        </div>

                        {folder.folder_type === 'custom' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {/* TODO: Rename */ }}>
                                        Renommer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {/* TODO: Change color */ }}>
                                        Changer la couleur
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {/* TODO: Delete */ }}
                                    >
                                        Supprimer
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                );
            })}

            {folders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun dossier</p>
                    <p className="text-xs mt-1">Créez votre premier dossier thématique</p>
                </div>
            )}
        </div>
    );
}
