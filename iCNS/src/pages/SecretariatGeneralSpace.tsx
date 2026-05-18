import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  LogOut,
  Scale,
  Archive,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BookOpen,
  FolderOpen
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import { IAstedChatModal } from '@/components/iasted/IAstedChatModal';
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { generateSystemPrompt } from "@/utils/generateSystemPrompt";
import { useUserContext } from "@/hooks/useUserContext";
import emblemGabon from "@/assets/emblem_gabon.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OfficialDecree, LegalReview, AdministrativeArchive } from "@/types/secretariat-general";
import { secretariatService } from "@/services/secretariatService";
import { NavItem } from '@/components/layout/MobileBottomNav';
import { AdminSpaceLayout } from '@/components/layout/AdminSpaceLayout';
import { useSuperAdmin } from "@/contexts/SuperAdminContext";

const SecretariatGeneralSpace = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const { setIsChatOpen } = useSuperAdmin();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [expandedSections, setExpandedSections] = useState({
    navigation: true,
    legal: true,
    archives: false,
  });

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'decrees', label: 'Décrets', icon: FileText },
    { id: 'reviews', label: 'Juridique', icon: Scale },
    { id: 'archives_list', label: 'Archives', icon: Archive },
  ];

  // Dialog states
  const [isDecreeDialogOpen, setIsDecreeDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

  const [selectedVoice, setSelectedVoice] = useState<'echo' | 'ash' | 'shimmer'>('echo');
  const userContext = useUserContext({ spaceName: 'SecretariatGeneralSpace' });

  // Access Control
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      // Check for sec_gen role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["sec_gen", "admin"]);

      if (!roles || roles.length === 0) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions nécessaires",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    };
    checkAccess();
  }, [navigate, toast]);

  // Écouter les événements de navigation et contrôle UI depuis SuperAdminContext
  useEffect(() => {
    const handleNavigationEvent = (e: CustomEvent) => {
      const { sectionId } = e.detail;
      console.log('📍 [SecretariatGeneralSpace] Événement navigation reçu:', sectionId);

      const accordionSections = ['navigation', 'legal', 'archives'];
      const sectionMap: Record<string, string> = {
        'dashboard': 'dashboard',
        'tableau-de-bord': 'dashboard',
        'decrees': 'decrees',
        'decrets': 'decrees',
        'textes': 'decrees',
        'reviews': 'reviews',
        'juridique': 'reviews',
        'avis': 'reviews',
        'veille': 'reviews',
        'archives_list': 'archives_list',
        'archives': 'archives_list',
        'coordination': 'dashboard',
        'interministerielle': 'dashboard'
      };

      const targetSection = sectionMap[sectionId] || sectionId;

      if (accordionSections.includes(targetSection)) {
        toggleSection(targetSection);
      } else {
        setActiveSection(targetSection);
        const parentSectionMap: Record<string, string> = {
          'dashboard': 'navigation',
          'decrees': 'legal',
          'reviews': 'legal',
          'archives_list': 'archives'
        };
        const parent = parentSectionMap[targetSection];
        if (parent) {
          setExpandedSections(prev => ({ ...prev, [parent]: true }));
        }
      }
    };

    const handleUIControlEvent = (e: CustomEvent) => {
      const { action } = e.detail;
      console.log('🎨 [SecretariatGeneralSpace] Événement UI Control reçu:', action);

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
  }, [theme, setTheme, toast]);

  // Data Fetching
  const { data: decrees = [], isLoading: decreesLoading } = useQuery({
    queryKey: ["official_decrees"],
    queryFn: secretariatService.getOfficialDecrees,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["legal_reviews"],
    queryFn: secretariatService.getLegalReviews,
  });

  const { data: archives = [], isLoading: archivesLoading } = useQuery({
    queryKey: ["administrative_archives"],
    queryFn: secretariatService.getAdministrativeArchives,
  });

  // Mutations
  const createDecreeMutation = useMutation({
    mutationFn: secretariatService.createOfficialDecree,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["official_decrees"] });
      toast({ title: "Succès", description: "Décret créé avec succès" });
      setIsDecreeDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: secretariatService.createLegalReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal_reviews"] });
      toast({ title: "Succès", description: "Demande d'avis créée avec succès" });
      setIsReviewDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const createArchiveMutation = useMutation({
    mutationFn: secretariatService.createAdministrativeArchive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["administrative_archives"] });
      toast({ title: "Succès", description: "Archive créée avec succès" });
      setIsArchiveDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });



  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Tool call handler for iAsted
  const handleToolCall = useCallback((toolName: string, args: any) => {
    console.log(`🔧 [SecretariatGeneralSpace] Tool call: ${toolName}`, args);
    switch (toolName) {
      case 'control_ui':
        if (args.action === 'toggle_theme') toggleTheme();
        else if (args.action === 'set_theme_dark') setTheme("dark");
        else if (args.action === 'set_theme_light') setTheme("light");
        else if (args.action === 'set_volume') toast({ title: "Volume", description: `Volume ajusté` });
        else if (args.action === 'set_speech_rate') {
          if (args.value && openaiRTC) openaiRTC.setSpeechRate(parseFloat(args.value));
          toast({ title: "Vitesse", description: `Vitesse ajustée` });
        }
        break;

      case 'change_voice':
        if (args.voice_id) {
          setSelectedVoice(args.voice_id as any);
          toast({ title: "Voix modifiée", description: `Voix changée pour ${args.voice_id}` });
        }
        break;

      case 'navigate_to_section':
        const sectionId = args.section_id;
        const accordionSections = ['navigation', 'legal', 'archives'];

        const sectionMap: Record<string, string> = {
          'dashboard': 'dashboard',
          'tableau-de-bord': 'dashboard',
          'decrees': 'decrees',
          'decrets': 'decrees',
          'textes': 'decrees',
          'reviews': 'reviews',
          'juridique': 'reviews',
          'avis': 'reviews',
          'veille': 'reviews',
          'archives_list': 'archives_list',
          'archives': 'archives_list',
          'coordination': 'dashboard',
          'interministerielle': 'dashboard'
        };

        const targetSection = sectionMap[sectionId] || sectionId;

        if (accordionSections.includes(targetSection)) {
          toggleSection(targetSection);
          toast({ title: "Navigation", description: `Section ${targetSection} basculée` });
        } else {
          setActiveSection(targetSection);

          const parentSectionMap: Record<string, string> = {
            'dashboard': 'navigation',
            'decrees': 'legal',
            'reviews': 'legal',
            'archives_list': 'archives'
          };

          const parent = parentSectionMap[targetSection];
          if (parent) {
            setExpandedSections(prev => ({ ...prev, [parent]: true }));
          }
          toast({ title: "Navigation", description: `Ouverture de ${targetSection}` });
        }
        break;

      case 'open_chat':
        setIsChatOpen(true);
        break;

      case 'close_chat':
        setIsChatOpen(false);
        break;

      case 'stop_conversation':
        setIsChatOpen(false);
        break;

      default:
        console.log('[SecretariatGeneralSpace] Tool call not handled:', toolName);
    }
  }, [toast, theme, setTheme]);

  const openaiRTC = useRealtimeVoiceWebRTC(handleToolCall);

  // Helper functions
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
      draft: { label: "Brouillon", variant: "outline" },
      pending_signature: { label: "En attente signature", variant: "default", className: "bg-orange-500 hover:bg-orange-600" },
      signed: { label: "Signé", variant: "secondary", className: "bg-blue-100 text-blue-700" },
      published: { label: "Publié", variant: "default", className: "bg-green-500 hover:bg-green-600" },
      pending: { label: "En attente", variant: "outline" },
      in_review: { label: "En examen", variant: "default", className: "bg-blue-500" },
      completed: { label: "Terminé", variant: "secondary", className: "bg-green-100 text-green-700" },
      // Archives access levels
      public: { label: "Public", variant: "secondary", className: "bg-green-100 text-green-700" },
      restricted: { label: "Restreint", variant: "outline", className: "border-orange-500 text-orange-500" },
      confidential: { label: "Confidentiel", variant: "default", className: "bg-orange-500" },
      secret: { label: "Secret", variant: "destructive", className: "bg-red-600" },
    };

    const config = variants[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  // Stats
  const stats = {
    decreesPending: decrees.filter(d => d.status === "pending_signature").length,
    reviewsUrgent: reviews.filter(r => r.priority === "high" && r.status !== "completed").length,
    decreesPublished: decrees.filter(d => d.status === "published").length,
    archivesTotal: archives.length,
  };

  if (decreesLoading || reviewsLoading || archivesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  const customSidebarNav = (
    <>
      {/* Navigation */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('navigation')}
          className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
        >
          NAVIGATION
          {expandedSections.navigation ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {expandedSections.navigation && (
          <nav className="space-y-1 ml-2">
            <button
              onClick={() => setActiveSection("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "dashboard"
                ? "neu-inset text-primary font-semibold"
                : "neu-raised hover:shadow-neo-md"
                } `}
            >
              <LayoutDashboard className="w-4 h-4" />
              Tableau de Bord
            </button>
          </nav>
        )}
      </div>

      {/* Légal */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('legal')}
          className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
        >
          JURIDIQUE
          {expandedSections.legal ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {expandedSections.legal && (
          <nav className="space-y-1 ml-2">
            <button
              onClick={() => setActiveSection("decrees")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "decrees"
                ? "neu-inset text-primary font-semibold"
                : "neu-raised hover:shadow-neo-md"
                } `}
            >
              <FileText className="w-4 h-4" />
              Décrets & Arrêtés
            </button>
            <button
              onClick={() => setActiveSection("reviews")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "reviews"
                ? "neu-inset text-primary font-semibold"
                : "neu-raised hover:shadow-neo-md"
                } `}
            >
              <Scale className="w-4 h-4" />
              Veille Juridique
            </button>
          </nav>
        )}
      </div>

      {/* Archives */}
      <div className="mb-4 flex-1">
        <button
          onClick={() => toggleSection('archives')}
          className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
        >
          ARCHIVES
          {expandedSections.archives ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {expandedSections.archives && (
          <nav className="space-y-1 ml-2">
            <button
              onClick={() => setActiveSection("archives_list")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "archives_list"
                ? "neu-inset text-primary font-semibold"
                : "neu-raised hover:shadow-neo-md"
                } `}
            >
              <Archive className="w-4 h-4" />
              Archives Admin.
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
      pageTitle="SECRÉTARIAT GÉNÉRAL"
      headerTitle="Espace Secrétariat Général"
      headerSubtitle="Coordination administrative, juridique et gestion des archives"
      customSidebarNav={customSidebarNav}
      rtc={openaiRTC}
      onOpenIasted={async () => {
        if (openaiRTC.isConnected) {
          openaiRTC.disconnect();
        } else {
          const systemPrompt = generateSystemPrompt(userContext);
          await openaiRTC.connect(selectedVoice, systemPrompt);
        }
      }}
    >

      {/* Dashboard */}
      {activeSection === "dashboard" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* KPIs */}
          <div className="neu-card p-6 mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-border">
              <div className="px-6 first:pl-0">
                <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                  <FileText className="w-6 h-6 text-orange-500" />
                </div>
                <div className="text-4xl font-bold mb-2">{stats.decreesPending}</div>
                <div className="text-sm font-medium">Décrets en attente</div>
                <div className="text-xs text-muted-foreground">De signature</div>
              </div>
              <div className="px-6">
                <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div className="text-4xl font-bold mb-2">{stats.reviewsUrgent}</div>
                <div className="text-sm font-medium">Avis Juridiques</div>
                <div className="text-xs text-muted-foreground">Urgents</div>
              </div>
              <div className="px-6">
                <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-4xl font-bold mb-2">{stats.decreesPublished}</div>
                <div className="text-sm font-medium">Textes Publiés</div>
                <div className="text-xs text-muted-foreground">Journal Officiel</div>
              </div>
              <div className="px-6">
                <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                  <FolderOpen className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-4xl font-bold mb-2">{stats.archivesTotal}</div>
                <div className="text-sm font-medium">Archives</div>
                <div className="text-xs text-muted-foreground">Total documents</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Decrees */}
            <div className="neu-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Derniers Textes
                </h3>
                <Button onClick={() => setActiveSection("decrees")} variant="ghost" size="sm" className="text-xs">
                  Voir tout
                </Button>
              </div>
              <div className="space-y-3">
                {decrees.slice(0, 3).map(decree => (
                  <div key={decree.id} className="neu-inset p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-2">{decree.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="font-mono">{decree.reference_number}</span>
                        </div>
                      </div>
                      {getStatusBadge(decree.status)}
                    </div>
                  </div>
                ))}
                {decrees.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">Aucun texte récent</div>
                )}
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="neu-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  Avis Juridiques Récents
                </h3>
                <Button onClick={() => setActiveSection("reviews")} variant="ghost" size="sm" className="text-xs">
                  Voir tout
                </Button>
              </div>
              <div className="space-y-3">
                {reviews.slice(0, 3).map(review => (
                  <div key={review.id} className="neu-raised p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{review.document_title}</p>
                        <p className="text-xs text-muted-foreground mt-1">Demandé par: {review.requestor}</p>
                      </div>
                      {getStatusBadge(review.status)}
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">Aucune demande récente</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decrees Section */}
      {activeSection === "decrees" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Décrets & Arrêtés</h2>
              <p className="text-muted-foreground">Gestion des textes officiels</p>
            </div>
            <Dialog open={isDecreeDialogOpen} onOpenChange={setIsDecreeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="neu-raised hover:shadow-neo-md transition-all">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau texte
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enregistrer un nouveau texte</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createDecreeMutation.mutate({
                      title: formData.get("title") as string,
                      reference_number: formData.get("reference_number") as string,
                      type: formData.get("type") as any,
                      status: "draft",
                    });
                  }}
                  className="space-y-4 py-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="type">Type de texte</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="decree">Décret</SelectItem>
                        <SelectItem value="order">Arrêté</SelectItem>
                        <SelectItem value="decision">Décision</SelectItem>
                        <SelectItem value="circular">Circulaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference_number">Numéro de référence</Label>
                    <Input id="reference_number" name="reference_number" placeholder="ex: 001/PR/2025" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre / Objet</Label>
                    <Input id="title" name="title" placeholder="Objet du texte..." required />
                  </div>
                  <Button type="submit" className="w-full" disabled={createDecreeMutation.isPending}>
                    {createDecreeMutation.isPending ? "Création..." : "Créer le brouillon"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {decrees.map((decree) => (
              <div key={decree.id} className="neu-card p-6 hover:translate-y-[-2px] transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-background/50 uppercase">{decree.type}</Badge>
                      <span className="font-mono text-sm text-muted-foreground">{decree.reference_number}</span>
                    </div>
                    <h3 className="font-semibold text-lg">{decree.title}</h3>
                  </div>
                  {getStatusBadge(decree.status)}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Créé le: {new Date(decree.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            ))}
            {decrees.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Aucun texte enregistré pour le moment</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {activeSection === "reviews" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Veille Juridique</h2>
              <p className="text-muted-foreground">Examen de conformité et avis juridiques</p>
            </div>
            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
              <DialogTrigger asChild>
                <Button className="neu-raised hover:shadow-neo-md transition-all">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle demande
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle demande d'avis</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createReviewMutation.mutate({
                      document_title: formData.get("document_title") as string,
                      requestor: formData.get("requestor") as string,
                      priority: formData.get("priority") as any,
                      status: "pending",
                      due_date: formData.get("due_date") as string,
                    });
                  }}
                  className="space-y-4 py-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="document_title">Document à examiner</Label>
                    <Input id="document_title" name="document_title" placeholder="Titre du document..." required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requestor">Demandeur</Label>
                    <Input id="requestor" name="requestor" placeholder="Service ou Ministère demandeur" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Date souhaitée</Label>
                    <Input id="due_date" name="due_date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priorité</Label>
                    <Select name="priority" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="low">Basse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={createReviewMutation.isPending}>
                    {createReviewMutation.isPending ? "Envoi..." : "Soumettre la demande"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {reviews.map((review) => (
              <div key={review.id} className="neu-card p-6 hover:translate-y-[-2px] transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="font-medium text-lg mb-2">{review.document_title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      Demandeur: <span className="text-foreground font-medium">{review.requestor}</span>
                    </div>
                  </div>
                  {getStatusBadge(review.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Pour le: {review.due_date ? new Date(review.due_date).toLocaleDateString('fr-FR') : 'Non défini'}
                  </div>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Scale className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Aucune demande d'avis en cours</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Archives Section */}
      {activeSection === "archives_list" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Archives Administratives</h2>
              <p className="text-muted-foreground">Consultation et archivage des documents</p>
            </div>
            <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
              <DialogTrigger asChild>
                <Button className="neu-raised hover:shadow-neo-md transition-all">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle archive
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Archiver un document</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createArchiveMutation.mutate({
                      title: formData.get("title") as string,
                      category: formData.get("category") as string,
                      reference_code: formData.get("reference_code") as string,
                      access_level: formData.get("access_level") as any,
                      archiving_date: new Date().toISOString(),
                    });
                  }}
                  className="space-y-4 py-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre du document</Label>
                    <Input id="title" name="title" placeholder="Titre..." required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference_code">Code de référence</Label>
                    <Input id="reference_code" name="reference_code" placeholder="ex: ARCH-2025-001" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Input id="category" name="category" placeholder="ex: Correspondance, Rapport..." required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="access_level">Niveau d'accès</Label>
                    <Select name="access_level" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le niveau" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="restricted">Restreint</SelectItem>
                        <SelectItem value="confidential">Confidentiel</SelectItem>
                        <SelectItem value="secret">Secret</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={createArchiveMutation.isPending}>
                    {createArchiveMutation.isPending ? "Archivage..." : "Archiver"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {archives.map((archive) => (
              <div key={archive.id} className="neu-card p-6 hover:translate-y-[-2px] transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-background/50">{archive.category}</Badge>
                      <span className="font-mono text-sm text-muted-foreground">{archive.reference_code}</span>
                    </div>
                    <h3 className="font-semibold text-lg">{archive.title}</h3>
                  </div>
                  {getStatusBadge(archive.access_level)}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Archivé le: {new Date(archive.archiving_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            ))}
            {archives.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Archive className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Aucune archive trouvée</p>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminSpaceLayout>
  );
};

export default SecretariatGeneralSpace;
