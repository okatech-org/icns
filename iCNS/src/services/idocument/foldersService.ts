// CRUD des dossiers iDocument + utilitaires d arborescence

import { supabase } from "@/integrations/supabase/client";
import type {
    IDocFolder,
    IDocFolderWithChildren,
    CreateIDocFolderInput,
} from "@/types/idocument";

const TABLE = "idoc_folders";

export const foldersService = {
    async list(): Promise<IDocFolder[]> {
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .neq("status", "trashed")
            .order("name");
        if (error) throw error;
        return (data || []) as unknown as IDocFolder[];
    },

    async get(id: string): Promise<IDocFolder | null> {
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error) throw error;
        return data as unknown as IDocFolder | null;
    },

    async create(input: CreateIDocFolderInput): Promise<IDocFolder> {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error("Non authentifie");
        const { data, error } = await supabase
            .from(TABLE)
            .insert({ ...input, created_by: userData.user.id } as never)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as IDocFolder;
    },

    async rename(id: string, name: string): Promise<IDocFolder> {
        const { data, error } = await supabase
            .from(TABLE)
            .update({ name } as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as IDocFolder;
    },

    async move(id: string, parent_folder_id: string | null): Promise<IDocFolder> {
        const { data, error } = await supabase
            .from(TABLE)
            .update({ parent_folder_id } as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as IDocFolder;
    },

    async remove(id: string): Promise<void> {
        const { error } = await supabase.from(TABLE).delete().eq("id", id);
        if (error) throw error;
    },

    /**
     * Construit l arborescence en memoire a partir d une liste plate.
     */
    buildTree(folders: IDocFolder[]): IDocFolderWithChildren[] {
        const map = new Map<string, IDocFolderWithChildren>();
        folders.forEach((f) => map.set(f.id, { ...f, children: [] }));
        const roots: IDocFolderWithChildren[] = [];
        map.forEach((node) => {
            if (node.parent_folder_id && map.has(node.parent_folder_id)) {
                map.get(node.parent_folder_id)!.children.push(node);
            } else {
                roots.push(node);
            }
        });
        return roots;
    },

    /**
     * Calcule le fil d Ariane (du dossier courant a la racine).
     */
    breadcrumb(folders: IDocFolder[], currentId: string | null): IDocFolder[] {
        if (!currentId) return [];
        const map = new Map(folders.map((f) => [f.id, f]));
        const trail: IDocFolder[] = [];
        let cursor = map.get(currentId);
        while (cursor) {
            trail.unshift(cursor);
            cursor = cursor.parent_folder_id ? map.get(cursor.parent_folder_id) : undefined;
        }
        return trail;
    },
};
