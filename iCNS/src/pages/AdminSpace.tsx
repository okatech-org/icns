import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserContext } from '@/hooks/useUserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
    ShieldAlert,
    Settings,
    Activity,
    Server,
    Database,
    Bot,
    LayoutDashboard,
    LogOut,
    Menu,
    ChevronRight,
    ChevronDown,
    Search,
    Bell,
    Moon,
    Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeedbacks } from "@/hooks/useSupabaseQuery";
import { useRealtimeFeedbacks } from "@/hooks/useRealtimeSync";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FeedbackDocumentsViewer } from "@/components/FeedbackDocumentsViewer";
import { useToast } from '@/hooks/use-toast';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTheme } from "next-themes";
import emblemGabon from "@/assets/emblem_gabon.png";
import { DocumentSettingsManager } from '@/components/admin/documents/DocumentSettingsManager';
import { FileText, Download, Eye, Paperclip, FileSpreadsheet, MessageSquare, FileCog } from "lucide-react";

// Admin Components
import { AIConfigSection } from '@/components/admin/AIConfigSection';
import { KnowledgeBaseSection } from '@/components/admin/KnowledgeBaseSection';
import { UserManagementSection } from '@/components/admin/UserManagementSection';
import { AuditLogSection } from '@/components/admin/AuditLogSection';
import { ConfigSection } from '@/components/admin/ConfigSection';
import { ProjectDocumentation } from '@/components/admin/ProjectDocumentation';
import { IntelligenceDashboard } from '@/components/admin/intelligence/IntelligenceDashboard';
import { MobileBottomNav, NavItem } from '@/components/layout/MobileBottomNav';
import { AdminSpaceLayout } from '@/components/layout/AdminSpaceLayout';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { generateSystemPrompt } from '@/utils/generateSystemPrompt';

interface Feedback {
    id: string;
    user_email: string;
    role_name: string;
    role_description: string;
    work_description: string;
    implementation_suggestions: string | null;
    created_at: string;
    status: string | null;
    document_paths: string[];
}

const AdminSpace = () => {
    const userContext = useUserContext({ spaceName: 'AdminSpace' });
    const { profile, role, isLoading } = userContext;
    const { openaiRTC, selectedVoice } = useSuperAdmin();
    // mobileMenuOpen is handled by AdminSpaceLayout

    const navItems: NavItem[] = useMemo(() => [
        { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
        { id: 'users', label: 'Utilisateurs', icon: Users },
        { id: 'feedbacks', label: 'Feedbacks', icon: MessageSquare },
        { id: 'intelligence', label: 'Intel', icon: ShieldAlert },
    ], []);

    const [activeSection, setActiveSection] = useState('dashboard');
    const [expandedSections, setExpandedSections] = useState({
        general: true,
        systeme: true,
        intelligence: true,
    });
    const { toast } = useToast();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const queryClient = useQueryClient();

    const [mounted, setMounted] = useState(false);

    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [showDocuments, setShowDocuments] = useState(false);

    // Statistics State
    const [stats, setStats] = useState({
        activeUsers: 0,
        systemHealth: 'Opérationnel' as const,
        securityAlerts: 0,
        iastedRequests: 0
    });

    // Feedback Data
    const { data: feedbacks = [], isLoading: loadingFeedbacks, error: feedbackError } = useFeedbacks();
    useRealtimeFeedbacks();

    // Track origin for navigation
    const [originRoute, setOriginRoute] = useState<string | null>(null);

    const handleNavigationLocally = useCallback((sectionId: string) => {
        // Map section IDs to valid sections
        const sectionMap: Record<string, string> = {
            'dashboard': 'dashboard',
            'tableau-de-bord': 'dashboard',
            'users': 'users',
            'utilisateurs': 'users',
            'feedbacks': 'feedbacks',
            'retours': 'feedbacks',
            'ai': 'ai',
            'ia': 'ai',
            'intelligence': 'intelligence',
            'veille': 'intelligence',
            'knowledge': 'knowledge',
            'base-connaissances': 'knowledge',
            'connaissances': 'knowledge',
            'audit': 'audit',
            'logs': 'audit',
            'config': 'config',
            'configuration': 'config',
            'documents': 'documents',
            'projet': 'projet',
            'project': 'projet',
            'documentation': 'projet'
        };

        const targetSection = sectionMap[sectionId] || sectionId;

        // Determine which accordion to open
        const generalSections = ['dashboard', 'users', 'feedbacks', 'projet'];
        const systemSections = ['ai', 'knowledge', 'audit', 'config', 'documents'];
        const intelligenceSections = ['intelligence'];

        if (generalSections.includes(targetSection)) {
            setExpandedSections(prev => ({ ...prev, general: true }));
        } else if (systemSections.includes(targetSection)) {
            setExpandedSections(prev => ({ ...prev, systeme: true }));
        } else if (intelligenceSections.includes(targetSection)) {
            setExpandedSections(prev => ({ ...prev, intelligence: true }));
        }

        setActiveSection(targetSection);

        toast({
            title: "Navigation",
            description: `Section ${targetSection} ouverte`,
        });
    }, [toast]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Écouter les événements de navigation et contrôle UI depuis SuperAdminContext
    useEffect(() => {
        const handleNavigationEvent = (e: CustomEvent) => {
            const { sectionId } = e.detail;
            console.log('📍 [AdminSpace] Événement navigation reçu:', sectionId);
            handleNavigationLocally(sectionId);
        };

        const handleUIControlEvent = (e: CustomEvent) => {
            const { action, value } = e.detail;
            console.log('🎨 [AdminSpace] Événement UI Control reçu:', action);

            if (action === 'toggle_theme') {
                setTheme(theme === 'dark' ? 'light' : 'dark');
            } else if (action === 'set_theme_dark') {
                setTheme('dark');
            } else if (action === 'set_theme_light') {
                setTheme('light');
            }
        };

        window.addEventListener('iasted-navigate-section', handleNavigationEvent as EventListener);
        window.addEventListener('iasted-control-ui', handleUIControlEvent as EventListener);

        return () => {
            window.removeEventListener('iasted-navigate-section', handleNavigationEvent as EventListener);
            window.removeEventListener('iasted-control-ui', handleUIControlEvent as EventListener);
        };
    }, [theme, setTheme, toast, handleNavigationLocally]);

    // Fetch real statistics
    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Count total users with roles
                const { count: userCount } = await supabase
                    .from('user_roles')
                    .select('*', { count: 'exact', head: true });

                // Count security alerts (last 7 days)
                const { count: alertsCount } = await (supabase as any)
                    .from('audit_logs')
                    .select('*', { count: 'exact', head: true })
                    .ilike('action', '%SECURITY%')
                    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

                // Count iAsted requests (this week)
                const { count: requestsCount } = await (supabase as any)
                    .from('audit_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('resource', 'iasted')
                    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

                setStats({
                    activeUsers: userCount || 0,
                    systemHealth: 'Opérationnel',
                    securityAlerts: alertsCount || 0,
                    iastedRequests: requestsCount || 0
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
                // Keep default values on error
            }
        };

        fetchStats();
        // Refresh stats every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    if (feedbackError) {
        toast({
            title: "Erreur",
            description: "Impossible de charger les feedbacks",
            variant: "destructive",
        });
    }

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case "processed":
                return <Badge variant="default">Traité</Badge>;
            case "pending":
                return <Badge variant="secondary">En attente</Badge>;
            default:
                return <Badge variant="outline">Nouveau</Badge>;
        }
    };

    const handleViewDocuments = (feedback: Feedback) => {
        setSelectedFeedback(feedback);
        setShowDocuments(true);
    };

    const exportToCSV = () => {
        try {
            const headers = ["Date", "Rôle", "Email", "Description rôle", "Description travail", "Suggestions", "Statut", "Documents"];
            const rows = feedbacks.map(feedback => [
                new Date(feedback.created_at).toLocaleDateString("fr-FR"),
                feedback.role_name,
                feedback.user_email,
                feedback.role_description.replace(/\n/g, " "),
                feedback.work_description.replace(/\n/g, " "),
                (feedback.implementation_suggestions || "-").replace(/\n/g, " "),
                feedback.status || "nouveau",
                feedback.document_paths?.length || 0
            ]);
            const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
            const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `feedbacks_${new Date().toISOString().split("T")[0]}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: "Export réussi", description: "Les feedbacks ont été exportés en CSV" });
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible d'exporter en CSV", variant: "destructive" });
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text("Feedbacks des responsables", 14, 20);
            doc.setFontSize(11);
            doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, 28);
            const tableData = feedbacks.map(feedback => [
                new Date(feedback.created_at).toLocaleDateString("fr-FR"),
                feedback.role_name,
                feedback.user_email,
                feedback.role_description.substring(0, 50) + "...",
                feedback.work_description.substring(0, 50) + "...",
                (feedback.implementation_suggestions || "-").substring(0, 50),
                feedback.status || "nouveau",
            ]);
            autoTable(doc, {
                head: [["Date", "Rôle", "Email", "Description rôle", "Description travail", "Suggestions", "Statut"]],
                body: tableData,
                startY: 35,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 139, 202] },
            });
            doc.save(`feedbacks_${new Date().toISOString().split("T")[0]}.pdf`);
            toast({ title: "Export réussi", description: "Les feedbacks ont été exportés en PDF" });
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible d'exporter en PDF", variant: "destructive" });
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Chargement...</div>;
    }

    // Allow both admin and president (who has admin rights)
    if (role !== 'admin' && role !== 'president') {
        return <div className="flex items-center justify-center h-screen text-red-500">Accès refusé. Réservé aux administrateurs.</div>;
    }

    const customSidebarNav = (
        <>
            {/* Navigation Générale */}
            <div className="mb-4">
                <button
                    onClick={() => toggleSection('general')}
                    className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
                >
                    GÉNÉRAL
                    {expandedSections.general ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                {expandedSections.general && (
                    <nav className="space-y-1 ml-2">
                        <button
                            onClick={() => setActiveSection('dashboard')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'dashboard' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Tableau de Bord
                        </button>
                        <button
                            onClick={() => setActiveSection('feedbacks')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'feedbacks' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                        >
                            <MessageSquare className="w-4 h-4" />
                            Feedbacks
                        </button>
                        <button
                            onClick={() => setActiveSection('users')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'users' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                        >
                            <Users className="w-4 h-4" />
                            Utilisateurs
                        </button>
                        <button
                            onClick={() => setActiveSection('projet')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'projet' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                        >
                            <FileText className="w-4 h-4" />
                            Projet
                        </button>
                    </nav>
                )}
            </div>

            {/* Navigation Intelligence */}
            <div className="mb-4">
                <button
                    onClick={() => toggleSection('intelligence')}
                    className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
                >
                    INTELLIGENCE
                    {expandedSections.intelligence ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                {expandedSections.intelligence && (
                    <nav className="space-y-1 ml-2">
                        <button
                            onClick={() => setActiveSection('intelligence')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'intelligence' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                        >
                            <ShieldAlert className="w-4 h-4" />
                            Oeil de Lynx
                        </button>
                    </nav>
                )}
            </div>

            {/* Navigation Système */}
            <div className="mb-4 flex-1">
                <button
                    onClick={() => toggleSection('systeme')}
                    className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
                >
                    SYSTÈME
                    {expandedSections.systeme ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                {expandedSections.systeme && (
                    <nav className="space-y-1 ml-2">
                        <button
                            onClick={() => setActiveSection('ai')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'ai' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                        >
                            <Bot className="w-4 h-4" />
                            IA & Voix
                        </button>
                        <button
                            onClick={() => setActiveSection('knowledge')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'knowledge' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                        >
                            <Database className="w-4 h-4" />
                            Connaissances
                        </button>
                        <button
                            onClick={() => setActiveSection('documents')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'documents' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                        >
                            <FileCog className="w-4 h-4" />
                            Gestion Documents
                        </button>
                        <button
                            onClick={() => setActiveSection('audit')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'audit' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                        >
                            <ShieldAlert className="w-4 h-4" />
                            Audit & Logs
                        </button>
                        <button
                            onClick={() => setActiveSection('config')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'config' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                        >
                            <Settings className="w-4 h-4" />
                            Configuration
                        </button>
                    </nav>
                )}
            </div>
        </>
    );

    return (
        <AdminSpaceLayout
            navItems={navItems}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            userContext={userContext}
            pageTitle="Administration"
            headerTitle="Administration Système"
            headerSubtitle="Gestion globale de la plateforme iAsted"
            customSidebarNav={customSidebarNav}
        >
            <div className="space-y-6">
                {activeSection === 'dashboard' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="neu-raised border-none">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Utilisateurs Totaux</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                                    <p className="text-xs text-muted-foreground">Comptes enregistrés</p>
                                </CardContent>
                            </Card>
                            <Card className="neu-raised border-none">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Santé Système</CardTitle>
                                    <Server className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{stats.systemHealth}</div>
                                    <p className="text-xs text-muted-foreground">Tous les services actifs</p>
                                </CardContent>
                            </Card>
                            <Card className="neu-raised border-none">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Alertes Sécurité</CardTitle>
                                    <ShieldAlert className="h-4 w-4 text-yellow-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.securityAlerts}</div>
                                    <p className="text-xs text-muted-foreground">7 derniers jours</p>
                                </CardContent>
                            </Card>
                            <Card className="neu-raised border-none">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Requêtes iAsted</CardTitle>
                                    <Activity className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.iastedRequests.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Cette semaine</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="neu-raised border-none">
                            <CardHeader>
                                <CardTitle>Activités Récentes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <AuditLogSection />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeSection === 'feedbacks' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <Card className="neu-raised border-none p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <FileText className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Feedbacks</p>
                                        <p className="text-2xl font-bold">{feedbacks.length}</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="neu-raised border-none p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-secondary/10">
                                        <Eye className="h-6 w-6 text-secondary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">En attente</p>
                                        <p className="text-2xl font-bold">
                                            {feedbacks.filter((f) => !f.status || f.status === "pending").length}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="neu-raised border-none p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-accent/10">
                                        <Download className="h-6 w-6 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Traités</p>
                                        <p className="text-2xl font-bold">
                                            {feedbacks.filter((f) => f.status === "processed").length}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <Card className="neu-raised border-none p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Feedbacks des responsables</h2>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={exportToCSV} className="gap-2">
                                        <FileSpreadsheet className="h-4 w-4" /> Exporter CSV
                                    </Button>
                                    <Button variant="outline" onClick={exportToPDF} className="gap-2">
                                        <FileText className="h-4 w-4" /> Exporter PDF
                                    </Button>
                                </div>
                            </div>
                            {loadingFeedbacks ? (
                                <p className="text-center text-muted-foreground py-8">Chargement...</p>
                            ) : feedbacks.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Aucun feedback pour le moment</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Rôle</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Suggestions</TableHead>
                                                <TableHead>Docs</TableHead>
                                                <TableHead>Statut</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {feedbacks.map((feedback) => (
                                                <TableRow key={feedback.id}>
                                                    <TableCell className="whitespace-nowrap">
                                                        {new Date(feedback.created_at).toLocaleDateString("fr-FR")}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{feedback.role_name}</TableCell>
                                                    <TableCell>{feedback.user_email}</TableCell>
                                                    <TableCell className="max-w-xs truncate">{feedback.role_description}</TableCell>
                                                    <TableCell className="max-w-xs truncate">{feedback.implementation_suggestions || "-"}</TableCell>
                                                    <TableCell>
                                                        {feedback.document_paths && feedback.document_paths.length > 0 ? (
                                                            <Button variant="outline" size="sm" onClick={() => handleViewDocuments(feedback)}>
                                                                <Paperclip className="h-4 w-4 mr-2" /> {feedback.document_paths.length}
                                                            </Button>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(feedback.status)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {activeSection === 'users' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <UserManagementSection />
                    </div>
                )}

                {activeSection === 'projet' && (
                    <ProjectDocumentation />
                )}

                {activeSection === 'ai' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <AIConfigSection />
                    </div>
                )}

                {activeSection === 'intelligence' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <IntelligenceDashboard />
                    </div>
                )}

                {activeSection === 'knowledge' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <KnowledgeBaseSection />
                    </div>
                )}

                {activeSection === 'documents' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <DocumentSettingsManager />
                    </div>
                )}

                {activeSection === 'audit' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <AuditLogSection />
                    </div>
                )}

                {activeSection === 'config' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ConfigSection />
                    </div>
                )}
            </div>

            {/* Documents Viewer Modal */}
            {selectedFeedback && (
                <FeedbackDocumentsViewer
                    isOpen={showDocuments}
                    onClose={() => {
                        setShowDocuments(false);
                        setSelectedFeedback(null);
                    }}
                    documentPaths={selectedFeedback.document_paths || []}
                    feedbackId={selectedFeedback.id}
                />
            )}
        </AdminSpaceLayout>
    );
};

export default AdminSpace;
