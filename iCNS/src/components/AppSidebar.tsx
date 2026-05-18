import {
  Home,
  Shield,
  User,
  Mic,
  LayoutDashboard,
  Users,
  AlertTriangle,
  Target,
  Eye,
  TrendingUp,
  FileText,
  Archive,
  Mail
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import emblemGabon from "@/assets/emblem_gabon.png";
import { usePresidentRole } from "@/hooks/usePresidentRole";
import { Badge } from "@/components/ui/badge";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

// Menu pour non-présidents
const standardMenuItems = [
  {
    title: "Tableau de bord",
    url: "/dashboard",
    icon: LayoutDashboard,
    description: "Vue d'ensemble"
  },
  {
    title: "iDocument",
    url: "/idocument",
    icon: FileText,
    description: "Gestion documentaire"
  },
  {
    title: "iArchive",
    url: "/iarchive",
    icon: Archive,
    description: "Archivage OHADA"
  },
  {
    title: "iCorrespondance",
    url: "/icorrespondance",
    icon: Mail,
    description: "Courriers officiels"
  },
];

// Pilotage Stratégique
const pilotageStrategique = [
  {
    title: "Vue d'Ensemble",
    hash: "#vue-ensemble",
    icon: LayoutDashboard,
    description: "KPIs & Situation"
  },
  {
    title: "Opinion Publique",
    hash: "#opinion-publique",
    icon: Users,
    description: "Pouls du Pays"
  },
  {
    title: "Vision Nationale",
    hash: "#vision-nationale",
    icon: Target,
    description: "Gabon 2025"
  },
];

// Actions Urgentes
const actionsUrgentes = [
  {
    title: "Situations Critiques",
    hash: "#situations-critiques",
    icon: AlertTriangle,
    description: "Arbitrages requis",
    badge: "23"
  },
  {
    title: "Protocole XR-7",
    hash: "#module-xr7",
    icon: Shield,
    description: "Urgence Nationale",
    badge: "CRITIQUE"
  },
];

// Contrôle & Institutions
const controleInstitutions = [
  {
    title: "Performance Institutions",
    hash: "#institutions",
    icon: TrendingUp,
    description: "Conseil Numérique"
  },
  {
    title: "Audit Trail",
    hash: "#audit",
    icon: Eye,
    description: "Traçabilité"
  },
];

// Outils
const outilsDecision = [
  {
    title: "iDocument",
    url: "/idocument",
    icon: FileText,
    description: "Gestion documentaire"
  },
  {
    title: "iArchive",
    url: "/iarchive",
    icon: Archive,
    description: "Archivage OHADA"
  },
  {
    title: "iCorrespondance",
    url: "/icorrespondance",
    icon: Mail,
    description: "Courriers officiels"
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const currentHash = location.hash;
  const { isPresident } = usePresidentRole();

  const isActive = (path: string) => currentPath === path || currentHash === path;

  const handleHashNavigation = (hash: string) => {
    const element = document.querySelector(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="rounded-3xl shadow-neo-lg bg-card border-0 overflow-hidden"
    >
      <SidebarHeader className="px-4 py-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="neu-raised w-12 h-12 rounded-full flex items-center justify-center p-2 shrink-0">
            <img
              src={emblemGabon}
              alt="Emblème de la République Gabonaise"
              className="w-full h-full object-contain"
            />
          </div>
          {open && (
            <div>
              <div className="font-bold text-sm">ADMIN.GA</div>
              <div className="text-xs text-muted-foreground">
                {isPresident ? "Espace Président" : "Tableau de Bord"}
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4 py-4 space-y-2">
        {isPresident ? (
          <>
            {/* Accès Espace Président */}
            <SidebarGroup className="px-0 space-y-1">
              <SidebarGroupLabel className="text-[11px] uppercase tracking-widest font-bold text-primary px-2 mb-1">
                Espace Président
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Espace Présidentiel"
                      isActive={isActive("/president-space")}
                      className="rounded-2xl transition-all h-auto p-0 hover:shadow-neo-md"
                    >
                      <NavLink
                        to="/president-space"
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all ${isActive("/president-space")
                          ? "bg-background shadow-neo-inset"
                          : "bg-background shadow-neo-sm hover:shadow-neo-md"
                          }`}
                      >
                        <div className={`p-2 rounded-full transition-all ${isActive("/president-space") ? "bg-primary/10" : "bg-card shadow-neo-sm"}`}>
                          <Shield className="h-4 w-4 shrink-0 text-primary" />
                        </div>
                        {open && (
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-medium truncate text-foreground">Espace Président</span>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {/* Alertes Urgentes */}
            <SidebarGroup className="px-0 space-y-1">
              <SidebarGroupLabel className="text-[11px] uppercase tracking-widest font-bold text-destructive px-2 mb-1">
                Alertes Urgentes
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {actionsUrgentes.map((item) => (
                    <SidebarMenuItem key={item.hash}>
                      <SidebarMenuButton
                        onClick={() => handleHashNavigation(item.hash)}
                        tooltip={item.title}
                        isActive={isActive(item.hash)}
                        className="rounded-2xl transition-all h-auto p-0 hover:shadow-neo-md"
                      >
                        <div className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all ${isActive(item.hash)
                          ? "bg-background shadow-neo-inset"
                          : "bg-background shadow-neo-sm hover:shadow-neo-md"
                          }`}>
                          <div className="p-2 rounded-full bg-destructive/10 shadow-neo-sm">
                            <item.icon className="h-4 w-4 shrink-0 text-destructive" />
                          </div>
                          {open && (
                            <>
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-semibold truncate text-destructive">{item.title}</span>
                              </div>
                              {item.badge && (
                                <Badge variant="destructive" className="shrink-0 h-6 min-w-[24px] flex items-center justify-center rounded-full text-[10px] px-2 font-bold">
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Pilotage Stratégique */}
            <SidebarGroup className="px-0 space-y-1">
              <SidebarGroupLabel className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground px-2 mb-1">
                Pilotage Stratégique
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {pilotageStrategique.map((item) => (
                    <SidebarMenuItem key={item.hash}>
                      <SidebarMenuButton
                        onClick={() => handleHashNavigation(item.hash)}
                        tooltip={item.title}
                        isActive={isActive(item.hash)}
                        className="rounded-2xl transition-all h-auto p-0 hover:shadow-neo-md"
                      >
                        <div className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all ${isActive(item.hash)
                          ? "bg-background shadow-neo-inset"
                          : "bg-background shadow-neo-sm hover:shadow-neo-md"
                          }`}>
                          <div className={`p-2 rounded-full transition-all ${isActive(item.hash) ? "bg-primary/10" : "bg-card shadow-neo-sm"}`}>
                            <item.icon className="h-4 w-4 shrink-0 text-primary" />
                          </div>
                          {open && (
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-sm font-medium truncate text-foreground">{item.title}</span>
                            </div>
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Contrôle & Institutions */}
            <SidebarGroup className="px-0 space-y-1">
              <SidebarGroupLabel className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground px-2 mb-1">
                Contrôle & Institutions
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {controleInstitutions.map((item) => (
                    <SidebarMenuItem key={item.hash}>
                      <SidebarMenuButton
                        onClick={() => handleHashNavigation(item.hash)}
                        tooltip={item.title}
                        isActive={isActive(item.hash)}
                        className="rounded-2xl transition-all h-auto p-0 hover:shadow-neo-md"
                      >
                        <div className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all ${isActive(item.hash)
                          ? "bg-background shadow-neo-inset"
                          : "bg-background shadow-neo-sm hover:shadow-neo-md"
                          }`}>
                          <div className={`p-2 rounded-full transition-all ${isActive(item.hash) ? "bg-primary/10" : "bg-card shadow-neo-sm"}`}>
                            <item.icon className="h-4 w-4 shrink-0 text-primary" />
                          </div>
                          {open && (
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-sm font-medium truncate text-foreground">{item.title}</span>
                            </div>
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Outils de Décision */}
            <SidebarGroup className="px-0 space-y-1">
              <SidebarGroupLabel className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground px-2 mb-1">
                Outils de Décision
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {outilsDecision.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive(item.url)}
                        className="rounded-2xl transition-all h-auto p-0 hover:shadow-neo-md"
                      >
                        <NavLink
                          to={item.url}
                          className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all ${isActive(item.url)
                            ? "bg-background shadow-neo-inset"
                            : "bg-background shadow-neo-sm hover:shadow-neo-md"
                            }`}
                        >
                          <div className={`p-2 rounded-full transition-all ${isActive(item.url) ? "bg-primary/10" : "bg-card shadow-neo-sm"}`}>
                            <item.icon className="h-4 w-4 shrink-0 text-primary" />
                          </div>
                          {open && (
                            <>
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-medium truncate text-foreground">{item.title}</span>
                              </div>
                              {item.badge && (
                                <Badge className="shrink-0 h-6 min-w-[24px] flex items-center justify-center rounded-full text-[10px] px-2 font-bold bg-primary/10 text-primary border-0 shadow-neo-sm">
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          /* Menu Standard */
          <SidebarGroup className="px-0 space-y-1">
            <SidebarGroupLabel className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground px-2 mb-1">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {standardMenuItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive(item.url)}
                      className="rounded-2xl transition-all h-auto p-0 hover:shadow-neo-md"
                    >
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all ${isActive(item.url)
                          ? "bg-background shadow-neo-inset"
                          : "bg-background shadow-neo-sm hover:shadow-neo-md"
                          }`}
                      >
                        <div className={`p-2 rounded-full transition-all ${isActive(item.url) ? "bg-primary/10" : "bg-card shadow-neo-sm"}`}>
                          <item.icon className="h-4 w-4 shrink-0 text-primary" />
                        </div>
                        {open && (
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-medium truncate text-foreground">{item.title}</span>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Administration"
                    isActive={isActive("/admin-space")}
                    className="rounded-2xl transition-all h-auto p-0 hover:shadow-neo-md"
                  >
                    <NavLink
                      to="/admin-space"
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all ${isActive("/admin-space")
                        ? "bg-background shadow-neo-inset"
                        : "bg-background shadow-neo-sm hover:shadow-neo-md"
                        }`}
                    >
                      <div className={`p-2 rounded-full transition-all ${isActive("/admin-space") ? "bg-primary/10" : "bg-card shadow-neo-sm"}`}>
                        <User className="h-4 w-4 shrink-0 text-primary" />
                      </div>
                      {open && (
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium truncate text-foreground">Administration</span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
