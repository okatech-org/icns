import { NavigateFunction } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export type CommandType = 'NAVIGATION' | 'ACTION' | 'DEV' | 'SYSTEM';

export interface Command {
    id: string;
    type: CommandType;
    name: string;
    description: string;
    keywords: string[];
    handler: (args: any, context: CommandContext) => Promise<void>;
}

export interface CommandContext {
    navigate: NavigateFunction;
    setTheme?: (theme: string) => void;
    // Add other context providers here (e.g., Supabase client, Global Store)
}

class CommandService {
    private commands: Map<string, Command> = new Map();
    private context: CommandContext | null = null;

    constructor() {
        this.registerDefaultCommands();
    }

    setContext(context: CommandContext) {
        this.context = context;
    }

    registerCommand(command: Command) {
        this.commands.set(command.id, command);
    }

    private registerDefaultCommands() {
        // --- NAVIGATION COMMANDS ---
        this.registerCommand({
            id: 'nav_home',
            type: 'NAVIGATION',
            name: 'Aller à l\'accueil',
            description: 'Navigue vers la page d\'accueil',
            keywords: ['accueil', 'home', 'maison', 'début'],
            handler: async (_, { navigate }) => navigate('/')
        });

        this.registerCommand({
            id: 'nav_settings',
            type: 'NAVIGATION',
            name: 'Ouvrir les paramètres',
            description: 'Ouvre la page de configuration',
            keywords: ['paramètres', 'réglages', 'config', 'settings', 'configuration'],
            handler: async (_, { navigate }) => navigate('/settings')
        });

        this.registerCommand({
            id: 'nav_admin',
            type: 'NAVIGATION',
            name: 'Accès Admin',
            description: 'Ouvre le panneau d\'administration',
            keywords: ['admin', 'administration', 'super admin'],
            handler: async (_, { navigate }) => navigate('/admin')
        });

        // --- SYSTEM ACTIONS ---
        this.registerCommand({
            id: 'sys_theme_dark',
            type: 'ACTION',
            name: 'Mode Sombre',
            description: 'Active le thème sombre',
            keywords: ['sombre', 'dark', 'nuit', 'éteindre lumière'],
            handler: async (_, { setTheme }) => {
                if (setTheme) setTheme('dark');
                toast({ title: '🌙 Mode Sombre activé' });
            }
        });

        this.registerCommand({
            id: 'sys_theme_light',
            type: 'ACTION',
            name: 'Mode Clair',
            description: 'Active le thème clair',
            keywords: ['clair', 'light', 'jour', 'allumer lumière'],
            handler: async (_, { setTheme }) => {
                if (setTheme) setTheme('light');
                toast({ title: '☀️ Mode Clair activé' });
            }
        });

        // --- DEV ORCHESTRATION ---
        this.registerCommand({
            id: 'dev_cursor_rule',
            type: 'DEV',
            name: 'Générer Règle Cursor',
            description: 'Crée une règle pour l\'IDE',
            keywords: ['règle', 'cursor', 'rule', 'dev', 'règle de dev'],
            handler: async (args, _) => {
                // In a real scenario, this would call an LLM to generate the rule
                // For now, we simulate the action
                console.log('Generating Cursor Rule:', args);
                toast({
                    title: '🛠️ Règle Cursor Générée',
                    description: 'Copiée dans le presse-papier (Simulation)',
                });
            }
        });
    }

    async execute(commandId: string, args: any = {}) {
        if (!this.context) {
            console.error('CommandService context not initialized');
            return;
        }

        const command = this.commands.get(commandId);
        if (!command) {
            console.warn(`Command ${commandId} not found`);
            return;
        }

        console.log(`[iAsted] Executing: ${command.name}`, args);
        try {
            await command.handler(args, this.context);
        } catch (error) {
            console.error(`Error executing ${commandId}:`, error);
            toast({
                title: 'Erreur d\'exécution',
                description: `Impossible d'exécuter ${command.name}`,
                variant: 'destructive'
            });
        }
    }

    // Simple keyword matcher (to be replaced by LLM intent classification)
    findCommand(input: string): Command | null {
        const lowerInput = input.toLowerCase();
        for (const command of this.commands.values()) {
            if (command.keywords.some(k => lowerInput.includes(k))) {
                return command;
            }
        }
        return null;
    }
}

export const commandService = new CommandService();
