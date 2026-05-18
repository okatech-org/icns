import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  LogOut, Mail, Plus, Search, Filter, ScanLine, Moon, Sun, CheckCircle2,
  LayoutDashboard, Inbox, FileText, Archive, Settings, Menu, ChevronRight
} from "lucide-react";
import emblemGabon from "@/assets/emblem_gabon.png";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import { IncomingMail, MailStats as MailStatsType } from "@/types/service-courriers-types";
import { MailCard } from "@/components/courrier/MailCard";

import { MailStats } from "@/components/courrier/MailStats";
import { IAstedChatModal } from '@/components/iasted/IAstedChatModal';
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { generateSystemPrompt } from "@/utils/generateSystemPrompt";
import { useUserContext } from "@/hooks/useUserContext";
import { MailSplitViewer } from "@/components/courrier/MailSplitViewer";
import { NavItem } from '@/components/layout/MobileBottomNav';
import { AdminSpaceLayout } from '@/components/layout/AdminSpaceLayout';
import { useSuperAdmin } from "@/contexts/SuperAdminContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { courrierService } from "@/services/courrierService";

const ServiceCourriersSpace = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState("dashboard");
  const { setIsChatOpen } = useSuperAdmin();

  const [selectedVoice, setSelectedVoice] = useState<'echo' | 'ash' | 'shimmer'>('echo');
  const userContext = useUserContext({ spaceName: 'ServiceCourriersSpace' });
  const queryClient = useQueryClient();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'incoming', label: 'Reçus', icon: Inbox },
    { id: 'processing', label: 'Traitement', icon: FileText },
    { id: 'archives', label: 'Archives', icon: Archive },
  ];

  // Selection state for Split View
  const [selectedMail, setSelectedMail] = useState<IncomingMail | null>(null);

  // Data state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMail, setNewMail] = useState({
    reference_number: "",
    sender: "",
    subject: "",
    type: "lettre",
    urgency: "normale",
    assigned_to: "",
    notes: "",
    digital_copy_url: ""
  });

  // Tool call handler for iAsted
  const handleToolCall = (toolName: string, args: any) => {
    console.log(`🔧 [ServiceCourriersSpace] Tool call: ${toolName}`, args);
    switch (toolName) {
      case 'control_ui':
        if (args.action === 'toggle_theme') setTheme(theme === 'dark' ? 'light' : 'dark');
        else if (args.action === 'set_theme_dark') setTheme("dark");
        else if (args.action === 'set_theme_light') setTheme("light");
        break;
      case 'change_voice':
        if (args.voice_id) setSelectedVoice(args.voice_id as any);
        break;
      case 'open_chat':
        setIsChatOpen(true);
        break;
      case 'close_chat':
        setIsChatOpen(false);
        break;
      case 'navigate_to_section':
        if (args.section_id) setActiveSection(args.section_id);
        break;
      default:
        console.log('[ServiceCourriersSpace] Tool call not handled:', toolName);
    }
  };

  const openaiRTC = useRealtimeVoiceWebRTC(handleToolCall);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      // Check for courrier role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "courrier");

      if (!roles || roles.length === 0) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions nécessaires",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }
    } catch (error) {
      console.error("Error checking access:", error);
      navigate("/auth");
    }
  };

  // React Query Data Fetching
  const { data: mails = [], isLoading: loading } = useQuery({
    queryKey: ["incoming_mails"],
    queryFn: courrierService.getIncomingMails,
  });

  // Mutations
  const createMailMutation = useMutation({
    mutationFn: courrierService.createIncomingMail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incoming_mails"] });
      setIsDialogOpen(false);
      toast({
        title: "Courrier enregistré",
        description: `Référence: ${newMail.reference_number}`,
      });
      setNewMail({
        reference_number: "",
        sender: "",
        subject: "",
        type: "lettre",
        urgency: "normale",
        assigned_to: "",
        notes: "",
        digital_copy_url: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      courrierService.updateMailStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incoming_mails"] });
      setSelectedMail(null);
      toast({
        title: "Statut mis à jour",
        description: `Le courrier ${data.reference_number} est maintenant ${data.status.replace('_', ' ')}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleCreateMail = async () => {
    if (!newMail.reference_number || !newMail.sender || !newMail.subject) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir les champs obligatoires (Référence, Expéditeur, Objet).",
        variant: "destructive",
      });
      return;
    }

    createMailMutation.mutate({
      ...newMail,
      received_date: new Date().toISOString(),
      status: "recu",
    } as any);
  };

  const handleMailValidation = (updatedMail: IncomingMail) => {
    // Determine next status based on current status or action
    // For simplicity, let's assume validation moves it to 'en_traitement' or 'distribue'
    // But the MailSplitViewer might pass a specific status update.
    // If updatedMail has a different status than selectedMail, use that.

    // In a real app, MailSplitViewer would likely trigger the mutation directly or pass the new status.
    // Here we'll assume 'distribue' if it was 'recu' or 'en_traitement'

    let nextStatus = "en_traitement";
    if (updatedMail.status === "en_traitement") nextStatus = "distribue";

    updateStatusMutation.mutate({ id: updatedMail.id, status: nextStatus });
  };

  const getFilteredMails = () => {
    let filtered = mails.filter(mail => {
      const matchesSearch =
        mail.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mail.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mail.reference_number.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    if (activeSection === "incoming") {
      filtered = filtered.filter(m => m.status === "recu");
    } else if (activeSection === "processing") {
      filtered = filtered.filter(m => m.status === "en_traitement");
    } else if (activeSection === "archives") {
      filtered = filtered.filter(m => m.status === "archive" || m.status === "distribue");
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(m => m.status === filterStatus);
    }

    return filtered;
  };

  const filteredMails = getFilteredMails();
  const stats = courrierService.getMailStats(mails);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des courriers...</p>
        </div>
      </div>
    );
  }

  const NavButton = ({ id, icon: Icon, label, count }: { id: string, icon: any, label: string, count?: number }) => (
    <button
      onClick={() => setActiveSection(id)}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${activeSection === id
        ? "neu-inset text-primary font-medium scale-105"
        : "hover:bg-white/50 dark:hover:bg-black/20 hover:scale-105"
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className="neu-raised">
          {count}
        </Badge>
      )}
    </button>
  );

  const customSidebarNav = (
    <nav className="space-y-2 flex-1">
      <NavButton id="dashboard" icon={LayoutDashboard} label="Tableau de bord" />
      <div className="my-4 border-t border-border/50" />
      <NavButton
        id="incoming"
        icon={Inbox}
        label="Nouveaux reçus"
        count={mails.filter(m => m.status === 'recu').length}
      />
      <NavButton
        id="processing"
        icon={FileText}
        label="En traitement"
        count={mails.filter(m => m.status === 'en_traitement').length}
      />
      <NavButton id="archives" icon={Archive} label="Archives" />
    </nav>
  );

  return (
    <AdminSpaceLayout
      navItems={navItems}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      userContext={userContext}
      pageTitle="Service Courriers"
      headerTitle={
        activeSection === 'dashboard' ? 'Tableau de bord' :
          activeSection === 'incoming' ? 'Courriers Reçus' :
            activeSection === 'processing' ? 'En Traitement' :
              activeSection === 'archives' ? 'Archives' : 'Service Courriers'
      }
      headerSubtitle={new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
      {/* Split View Modal */}
      {selectedMail && (
        <MailSplitViewer
          mail={selectedMail}
          onClose={() => setSelectedMail(null)}
          onValidate={handleMailValidation}
        />
      )
      }

      {/* Main Content */}
      <div className="flex justify-end mb-8">

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="neu-raised hover:shadow-neo-md transition-all bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Courrier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enregistrer un nouveau courrier</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Référence <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="REF-2025-XXX"
                      value={newMail.reference_number}
                      onChange={(e) => setNewMail({ ...newMail, reference_number: e.target.value })}
                    />
                    <Button size="icon" variant="outline" title="Générer auto">
                      <ScanLine className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newMail.type}
                    onValueChange={(v) => setNewMail({ ...newMail, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lettre">Lettre</SelectItem>
                      <SelectItem value="colis">Colis</SelectItem>
                      <SelectItem value="facture">Facture</SelectItem>
                      <SelectItem value="invitation">Invitation</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Expéditeur <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Nom de l'expéditeur / Organisme"
                  value={newMail.sender}
                  onChange={(e) => setNewMail({ ...newMail, sender: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Objet <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Objet du courrier"
                  value={newMail.subject}
                  onChange={(e) => setNewMail({ ...newMail, subject: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Urgence</Label>
                  <Select
                    value={newMail.urgency}
                    onValueChange={(v) => setNewMail({ ...newMail, urgency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faible">Faible</SelectItem>
                      <SelectItem value="normale">Normale</SelectItem>
                      <SelectItem value="haute">Haute</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Service Destinataire</Label>
                  <Select
                    value={newMail.assigned_to}
                    onValueChange={(v) => setNewMail({ ...newMail, assigned_to: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cabinet_private">Cabinet Privé</SelectItem>
                      <SelectItem value="secretariat_general">Secrétariat Général</SelectItem>
                      <SelectItem value="protocol">Protocole</SelectItem>
                      <SelectItem value="dgss">DGSS</SelectItem>
                      <SelectItem value="president">Président</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Copie Numérique (GED)</Label>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <Input
                      type="file"
                      className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewMail({ ...newMail, digital_copy_url: URL.createObjectURL(file) });
                        }
                      }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      toast({
                        title: "Numérisation en cours...",
                        description: "Veuillez patienter pendant la connexion au scanner.",
                      });
                      setTimeout(() => {
                        setNewMail({ ...newMail, digital_copy_url: "scanned_document_v1.pdf" });
                        toast({
                          title: "Numérisation terminée",
                          description: "Le document a été joint avec succès.",
                        });
                      }, 2000);
                    }}
                  >
                    <ScanLine className="h-4 w-4" />
                    Scanner
                  </Button>
                </div>
                {newMail.digital_copy_url && (
                  <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Document joint : {newMail.digital_copy_url.split('/').pop()}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notes / Instructions</Label>
                <Textarea
                  placeholder="Notes complémentaires..."
                  value={newMail.notes}
                  onChange={(e) => setNewMail({ ...newMail, notes: e.target.value })}
                />
              </div>

              <Button onClick={handleCreateMail} className="w-full" disabled={createMailMutation.isPending}>
                {createMailMutation.isPending ? "Enregistrement..." : "Enregistrer le courrier"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard View */}
      {activeSection === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <MailStats stats={stats} />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Courriers Récents</h3>
              <Button variant="link" onClick={() => setActiveSection('incoming')}>
                Voir tout <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid gap-4">
              {mails.slice(0, 3).map(mail => (
                <MailCard
                  key={mail.id}
                  mail={mail}
                  onView={(m) => setSelectedMail(m)}
                />
              ))}
              {mails.length === 0 && (
                <div className="text-center py-12 text-muted-foreground neu-inset rounded-xl">
                  Aucun courrier récent
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List Views */}
      {activeSection !== 'dashboard' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-10 neu-inset"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] neu-raised">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="recu">Reçu</SelectItem>
                <SelectItem value="en_traitement">En traitement</SelectItem>
                <SelectItem value="distribue">Distribué</SelectItem>
                <SelectItem value="archive">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredMails.map(mail => (
              <MailCard
                key={mail.id}
                mail={mail}
                onView={(m) => setSelectedMail(m)}
              />
            ))}
            {filteredMails.length === 0 && (
              <div className="text-center py-12 text-muted-foreground neu-inset rounded-xl">
                Aucun courrier trouvé dans cette section
              </div>
            )}
          </div>
        </div>
      )}
    </AdminSpaceLayout>
  );

};

export default ServiceCourriersSpace;
