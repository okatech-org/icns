// Catalogue exhaustif des personas iCNS pour les comptes démo
// Référence : NTSAGUI/CNS/CDC/2026/001 §1.3 (13 bénéficiaires + CNS central)
//
// Les noms et matricules sont **fictifs** — données de démonstration uniquement.
// Ne JAMAIS injecter de matricules / noms réels d'agents dans ce fichier.

export type RoleICNS =
  | "officier_traitant"
  | "chef_section"
  | "directeur_service"
  | "analyste_cns"
  | "sg_cns"
  | "rssi"
  | "auditeur"
  | "admin_technique";

export type Classification = "DR" | "CD" | "SD" | "TSD";

export type ServiceCategorie =
  | "cns_central"
  | "renseignement"
  | "force_defense"
  | "securite_admin";

export interface Persona {
  matricule: string;
  prenomNom: string;
  grade: string;
  role: RoleICNS;
  fonction: string;
  serviceCode: string;
  serviceLabel: string;
  categorie: ServiceCategorie;
  classificationMax: Classification;
  perimetreBdC: string;
  iconKey:
    | "shield"
    | "shieldAlert"
    | "eye"
    | "users"
    | "fileSignature"
    | "search"
    | "archive"
    | "settings"
    | "anchor"
    | "plane"
    | "swords"
    | "scale"
    | "truck";
}

// ──────────────────────────────────────────────────────────────────────
// CNS Central — Secrétariat permanent + fonctions transverses
// ──────────────────────────────────────────────────────────────────────

const CNS_CENTRAL: Persona[] = [
  {
    matricule: "CNS-SG-001",
    prenomNom: "Gén. Charles ESSONO",
    grade: "Général de division",
    role: "sg_cns",
    fonction: "Secrétaire Général du CNS",
    serviceCode: "CNS_SECRETARIAT",
    serviceLabel: "Secrétariat permanent du CNS",
    categorie: "cns_central",
    classificationMax: "TSD",
    perimetreBdC: "Périmètre national complet (couverture inter-services)",
    iconKey: "shield",
  },
  {
    matricule: "CNS-SGA-001",
    prenomNom: "Col. Marie-Claire ANGUE",
    grade: "Colonel",
    role: "sg_cns",
    fonction: "Secrétaire Générale Adjointe (Délégation SG)",
    serviceCode: "CNS_SECRETARIAT",
    serviceLabel: "Secrétariat permanent du CNS",
    categorie: "cns_central",
    classificationMax: "TSD",
    perimetreBdC: "Délégation explicite du SG sur le périmètre national",
    iconKey: "shield",
  },
  {
    matricule: "CNS-ANA-001",
    prenomNom: "M. Alain NDONG",
    grade: "Civil — Cadre A",
    role: "analyste_cns",
    fonction: "Analyste principal — Croisement multi-services",
    serviceCode: "CNS_SECRETARIAT",
    serviceLabel: "Cellule de coordination CNS",
    categorie: "cns_central",
    classificationMax: "TSD",
    perimetreBdC: "Croisement de tous services, analyse de convergences",
    iconKey: "search",
  },
  {
    matricule: "CNS-ANA-002",
    prenomNom: "Mme Carole MBOUMBA",
    grade: "Civil — Cadre A",
    role: "analyste_cns",
    fonction: "Analyste — Indexation et synthèses",
    serviceCode: "CNS_SECRETARIAT",
    serviceLabel: "Cellule de coordination CNS",
    categorie: "cns_central",
    classificationMax: "SD",
    perimetreBdC: "Analyse thématique : crises régionales, narcotrafic",
    iconKey: "search",
  },
  {
    matricule: "CNS-ANA-003",
    prenomNom: "M. Pascal BOUCKAT",
    grade: "Civil — Cadre A",
    role: "analyste_cns",
    fonction: "Analyste — Veille cybernétique",
    serviceCode: "CNS_SECRETARIAT",
    serviceLabel: "Cellule de coordination CNS",
    categorie: "cns_central",
    classificationMax: "SD",
    perimetreBdC: "Cybermenaces, sécurité numérique",
    iconKey: "search",
  },
  {
    matricule: "RSSI-001",
    prenomNom: "Mme Sandrine MENGUE",
    grade: "Civil — Cadre supérieur",
    role: "rssi",
    fonction: "Responsable Sécurité Système d'Information",
    serviceCode: "CNS_SECRETARIAT",
    serviceLabel: "Cellule technique iCNS",
    categorie: "cns_central",
    classificationMax: "TSD",
    perimetreBdC: "Audit cryptographique + accès aux journaux scellés",
    iconKey: "shieldAlert",
  },
  {
    matricule: "AUDIT-001",
    prenomNom: "Me. Bernard NZE",
    grade: "Cabinet d'audit externe sur mandat",
    role: "auditeur",
    fonction: "Auditeur indépendant",
    serviceCode: "CNS_SECRETARIAT",
    serviceLabel: "Cabinet d'audit externe",
    categorie: "cns_central",
    classificationMax: "SD",
    perimetreBdC: "Lecture seule sur mandat de la commission audit",
    iconKey: "archive",
  },
  {
    matricule: "ADM-001",
    prenomNom: "M. Jean MBOUMBA",
    grade: "Civil — Ingénieur système",
    role: "admin_technique",
    fonction: "Administrateur technique de la plateforme",
    serviceCode: "CNS_SECRETARIAT",
    serviceLabel: "Cellule technique iCNS",
    categorie: "cns_central",
    classificationMax: "CD",
    perimetreBdC: "Configuration plateforme, sans accès contenus chiffrés",
    iconKey: "settings",
  },
];

// ──────────────────────────────────────────────────────────────────────
// Services de renseignement (B2, DGDI, DGR, DGSS)
// ──────────────────────────────────────────────────────────────────────

const RENSEIGNEMENT: Persona[] = [
  // B2 — Sécurité d'État
  {
    matricule: "B2-DIR-001",
    prenomNom: "Col. Étienne IBINGA",
    grade: "Colonel",
    role: "directeur_service",
    fonction: "Directeur du B2",
    serviceCode: "B2",
    serviceLabel: "B2 — Sécurité d'État",
    categorie: "renseignement",
    classificationMax: "TSD",
    perimetreBdC: "Sécurité d'État, contre-ingérence",
    iconKey: "fileSignature",
  },
  {
    matricule: "B2-CHF-001",
    prenomNom: "Cdt Joseph BAKALA",
    grade: "Commandant",
    role: "chef_section",
    fonction: "Chef de section opérations B2",
    serviceCode: "B2",
    serviceLabel: "B2 — Sécurité d'État",
    categorie: "renseignement",
    classificationMax: "SD",
    perimetreBdC: "Visa des dossiers contre-espionnage",
    iconKey: "users",
  },
  {
    matricule: "B2-001",
    prenomNom: "Lt-Col Marc OBIANG",
    grade: "Lieutenant-Colonel",
    role: "officier_traitant",
    fonction: "Officier traitant — Contre-ingérence",
    serviceCode: "B2",
    serviceLabel: "B2 — Sécurité d'État",
    categorie: "renseignement",
    classificationMax: "SD",
    perimetreBdC: "Contre-ingérence interne, suivi de cibles désignées",
    iconKey: "eye",
  },

  // DGDI — Documentation et Immigration
  {
    matricule: "DGDI-DIR-001",
    prenomNom: "Col. Patricia NGUEMA",
    grade: "Colonel",
    role: "directeur_service",
    fonction: "Directrice Générale de la Documentation et de l'Immigration",
    serviceCode: "DGDI",
    serviceLabel: "DGDI — Documentation et Immigration",
    categorie: "renseignement",
    classificationMax: "TSD",
    perimetreBdC: "Frontières, identité, migrations",
    iconKey: "fileSignature",
  },
  {
    matricule: "DGDI-CHF-001",
    prenomNom: "Maj. Robert MOUNGUENGUI",
    grade: "Major",
    role: "chef_section",
    fonction: "Chef section investigations migratoires",
    serviceCode: "DGDI",
    serviceLabel: "DGDI — Documentation et Immigration",
    categorie: "renseignement",
    classificationMax: "SD",
    perimetreBdC: "Flux migratoires, faux documents",
    iconKey: "users",
  },
  {
    matricule: "DGDI-001",
    prenomNom: "Cap. Sylvie ELLA",
    grade: "Capitaine",
    role: "officier_traitant",
    fonction: "Officier traitant — Frontières et migrations",
    serviceCode: "DGDI",
    serviceLabel: "DGDI — Documentation et Immigration",
    categorie: "renseignement",
    classificationMax: "SD",
    perimetreBdC: "Frontière Sud (Gabon/Congo), passages illicites",
    iconKey: "eye",
  },

  // DGR — Renseignement extérieur
  {
    matricule: "DGR-DIR-001",
    prenomNom: "Col. Pierre OBAME",
    grade: "Colonel",
    role: "directeur_service",
    fonction: "Directeur Général du Renseignement (extérieur)",
    serviceCode: "DGR",
    serviceLabel: "DGR — Renseignement extérieur",
    categorie: "renseignement",
    classificationMax: "TSD",
    perimetreBdC: "Renseignement extérieur, États voisins, organisations sub-régionales",
    iconKey: "fileSignature",
  },
  {
    matricule: "DGR-CHF-001",
    prenomNom: "Maj. Henri AGOSSOU",
    grade: "Major",
    role: "chef_section",
    fonction: "Chef section Afrique Centrale",
    serviceCode: "DGR",
    serviceLabel: "DGR — Renseignement extérieur",
    categorie: "renseignement",
    classificationMax: "SD",
    perimetreBdC: "Suivi des États de la CEMAC",
    iconKey: "users",
  },
  {
    matricule: "DGR-001",
    prenomNom: "Lt-Col Alain BIYOGHE",
    grade: "Lieutenant-Colonel",
    role: "officier_traitant",
    fonction: "Officier traitant — Bureau Cameroun",
    serviceCode: "DGR",
    serviceLabel: "DGR — Renseignement extérieur",
    categorie: "renseignement",
    classificationMax: "SD",
    perimetreBdC: "Veille sécurité Cameroun et frontière nord",
    iconKey: "eye",
  },

  // DGSS — Sécurité Spéciale
  {
    matricule: "DGSS-DIR-001",
    prenomNom: "Col. Christian MOUSSAVOU",
    grade: "Colonel",
    role: "directeur_service",
    fonction: "Directeur Général des Services Spéciaux",
    serviceCode: "DGSS",
    serviceLabel: "DGSS — Services Spéciaux",
    categorie: "renseignement",
    classificationMax: "TSD",
    perimetreBdC: "Renseignement spécial, dossiers TSD",
    iconKey: "fileSignature",
  },
  {
    matricule: "DGSS-CHF-001",
    prenomNom: "Maj. Pierre OBONGO",
    grade: "Major",
    role: "chef_section",
    fonction: "Chef section narcotrafic",
    serviceCode: "DGSS",
    serviceLabel: "DGSS — Services Spéciaux",
    categorie: "renseignement",
    classificationMax: "SD",
    perimetreBdC: "Lutte contre le narcotrafic, frontière terrestre",
    iconKey: "users",
  },
  {
    matricule: "DGSS-001",
    prenomNom: "Lt-Col Jean KOUMBA",
    grade: "Lieutenant-Colonel",
    role: "officier_traitant",
    fonction: "Officier traitant — Narcotrafic frontière Est",
    serviceCode: "DGSS",
    serviceLabel: "DGSS — Services Spéciaux",
    categorie: "renseignement",
    classificationMax: "SD",
    perimetreBdC: "Narcotrafic, frontière terrestre Est",
    iconKey: "eye",
  },
];

// ──────────────────────────────────────────────────────────────────────
// Forces de défense (GR, GN, FAG Terre/Air/Marine)
// ──────────────────────────────────────────────────────────────────────

const FORCES_DEFENSE: Persona[] = [
  // Garde Républicaine
  {
    matricule: "GR-DIR-001",
    prenomNom: "Gén. André MEZUI",
    grade: "Général de brigade",
    role: "directeur_service",
    fonction: "Commandant de la Garde Républicaine",
    serviceCode: "GR",
    serviceLabel: "Garde Républicaine",
    categorie: "force_defense",
    classificationMax: "TSD",
    perimetreBdC: "Sécurité des hautes autorités, sites stratégiques",
    iconKey: "swords",
  },
  {
    matricule: "GR-CHF-001",
    prenomNom: "Col. Jean-Marie ABESSOLO",
    grade: "Colonel",
    role: "chef_section",
    fonction: "Chef cellule renseignement GR",
    serviceCode: "GR",
    serviceLabel: "Garde Républicaine",
    categorie: "force_defense",
    classificationMax: "SD",
    perimetreBdC: "Menaces internes contre sites présidentiels",
    iconKey: "users",
  },
  {
    matricule: "GR-001",
    prenomNom: "Cdt Pascal MBADINGA",
    grade: "Commandant",
    role: "officier_traitant",
    fonction: "Officier traitant — Sécurité protocolaire",
    serviceCode: "GR",
    serviceLabel: "Garde Républicaine",
    categorie: "force_defense",
    classificationMax: "SD",
    perimetreBdC: "Veille événements officiels, déplacements présidentiels",
    iconKey: "eye",
  },

  // Gendarmerie Nationale
  {
    matricule: "GN-DIR-001",
    prenomNom: "Gén. François NDONG",
    grade: "Général de division",
    role: "directeur_service",
    fonction: "Directeur Général de la Gendarmerie",
    serviceCode: "GN",
    serviceLabel: "Gendarmerie Nationale",
    categorie: "force_defense",
    classificationMax: "TSD",
    perimetreBdC: "Maillage territorial, police judiciaire militaire",
    iconKey: "fileSignature",
  },
  {
    matricule: "GN-CHF-001",
    prenomNom: "Col. Patrick MABIKA",
    grade: "Colonel",
    role: "chef_section",
    fonction: "Chef section recherches GN",
    serviceCode: "GN",
    serviceLabel: "Gendarmerie Nationale",
    categorie: "force_defense",
    classificationMax: "SD",
    perimetreBdC: "Enquêtes spécialisées, criminalité organisée",
    iconKey: "users",
  },
  {
    matricule: "GN-001",
    prenomNom: "Cap. Léa TCHIBINDA",
    grade: "Capitaine",
    role: "officier_traitant",
    fonction: "Officier traitant — Recherches Estuaire",
    serviceCode: "GN",
    serviceLabel: "Gendarmerie Nationale",
    categorie: "force_defense",
    classificationMax: "SD",
    perimetreBdC: "Province de l'Estuaire, criminalité organisée",
    iconKey: "eye",
  },

  // FAG Terre
  {
    matricule: "FAGT-DIR-001",
    prenomNom: "Gén. Brice MOUKAGNI",
    grade: "Général de brigade",
    role: "directeur_service",
    fonction: "Chef du Renseignement Forces Armées Terre",
    serviceCode: "FAG_TERRE",
    serviceLabel: "FAG Terre — Forces Armées Gabonaises",
    categorie: "force_defense",
    classificationMax: "TSD",
    perimetreBdC: "Renseignement militaire territorial",
    iconKey: "swords",
  },
  {
    matricule: "FAGT-CHF-001",
    prenomNom: "Col. Daniel MIHINDOU",
    grade: "Colonel",
    role: "chef_section",
    fonction: "Chef section opérations FAG/T",
    serviceCode: "FAG_TERRE",
    serviceLabel: "FAG Terre — Forces Armées Gabonaises",
    categorie: "force_defense",
    classificationMax: "SD",
    perimetreBdC: "Manoeuvres terrestres, exercices conjoints",
    iconKey: "users",
  },
  {
    matricule: "FAGT-001",
    prenomNom: "Cap. Yannick BOUNDA",
    grade: "Capitaine",
    role: "officier_traitant",
    fonction: "Officier traitant — Bureau Haut-Ogooué",
    serviceCode: "FAG_TERRE",
    serviceLabel: "FAG Terre — Forces Armées Gabonaises",
    categorie: "force_defense",
    classificationMax: "SD",
    perimetreBdC: "Province du Haut-Ogooué, frontière RDC",
    iconKey: "eye",
  },

  // FAG Air
  {
    matricule: "FAGA-DIR-001",
    prenomNom: "Gén. Pierre-Claver MOUSSOUNDA",
    grade: "Général de brigade aérienne",
    role: "directeur_service",
    fonction: "Chef du Renseignement Forces Armées Air",
    serviceCode: "FAG_AIR",
    serviceLabel: "FAG Air — Forces Armées Gabonaises",
    categorie: "force_defense",
    classificationMax: "TSD",
    perimetreBdC: "Surveillance aérienne, espace national",
    iconKey: "plane",
  },
  {
    matricule: "FAGA-CHF-001",
    prenomNom: "Col. Hugues NZUE",
    grade: "Colonel",
    role: "chef_section",
    fonction: "Chef section surveillance aérienne",
    serviceCode: "FAG_AIR",
    serviceLabel: "FAG Air — Forces Armées Gabonaises",
    categorie: "force_defense",
    classificationMax: "SD",
    perimetreBdC: "Trajectoires aériennes suspectes, contrôle de l'espace",
    iconKey: "users",
  },
  {
    matricule: "FAGA-001",
    prenomNom: "Lt-Col Cédric NDOUTOUMOU",
    grade: "Lieutenant-Colonel",
    role: "officier_traitant",
    fonction: "Officier traitant — Bureau radar Libreville",
    serviceCode: "FAG_AIR",
    serviceLabel: "FAG Air — Forces Armées Gabonaises",
    categorie: "force_defense",
    classificationMax: "SD",
    perimetreBdC: "Surveillance espace aérien autour de Libreville",
    iconKey: "eye",
  },

  // FAG Marine
  {
    matricule: "FAGM-DIR-001",
    prenomNom: "C.V. Olivier KOUMBA-MOUYABI",
    grade: "Capitaine de vaisseau",
    role: "directeur_service",
    fonction: "Chef du Renseignement Marine Nationale",
    serviceCode: "FAG_MARINE",
    serviceLabel: "FAG Marine — Forces Armées Gabonaises",
    categorie: "force_defense",
    classificationMax: "TSD",
    perimetreBdC: "Surveillance maritime, ZEE, piraterie",
    iconKey: "anchor",
  },
  {
    matricule: "FAGM-CHF-001",
    prenomNom: "Cdt Stéphane MAVOUNGOU",
    grade: "Capitaine de frégate",
    role: "chef_section",
    fonction: "Chef section opérations maritimes",
    serviceCode: "FAG_MARINE",
    serviceLabel: "FAG Marine — Forces Armées Gabonaises",
    categorie: "force_defense",
    classificationMax: "SD",
    perimetreBdC: "Patrouilles Atlantique, sécurité pétrolière offshore",
    iconKey: "users",
  },
  {
    matricule: "FAGM-001",
    prenomNom: "L.V. Bénédicte ESSOMBA",
    grade: "Lieutenant de vaisseau",
    role: "officier_traitant",
    fonction: "Officier traitant — Bureau Port-Gentil",
    serviceCode: "FAG_MARINE",
    serviceLabel: "FAG Marine — Forces Armées Gabonaises",
    categorie: "force_defense",
    classificationMax: "SD",
    perimetreBdC: "Port-Gentil, pêche illicite, trafic maritime",
    iconKey: "eye",
  },
];

// ──────────────────────────────────────────────────────────────────────
// Administrations de sécurité (POLICE, SILAM, DGSP, DOUANE)
// ──────────────────────────────────────────────────────────────────────

const SECURITE_ADMIN: Persona[] = [
  // Police Nationale (cellule Renseignements généraux)
  {
    matricule: "POL-DIR-001",
    prenomNom: "C.D. Roger NGAMA",
    grade: "Commissaire divisionnaire",
    role: "directeur_service",
    fonction: "Directeur des Renseignements Généraux",
    serviceCode: "POLICE",
    serviceLabel: "Police Nationale — RG",
    categorie: "securite_admin",
    classificationMax: "TSD",
    perimetreBdC: "Ordre public, mouvements sociaux, RG",
    iconKey: "scale",
  },
  {
    matricule: "POL-CHF-001",
    prenomNom: "Cdt Charles ESSONO",
    grade: "Commandant de police",
    role: "chef_section",
    fonction: "Chef section RG Libreville",
    serviceCode: "POLICE",
    serviceLabel: "Police Nationale — RG",
    categorie: "securite_admin",
    classificationMax: "SD",
    perimetreBdC: "Renseignement urbain Libreville",
    iconKey: "users",
  },
  {
    matricule: "POL-001",
    prenomNom: "Insp. Aimée OYANE",
    grade: "Inspecteur de police",
    role: "officier_traitant",
    fonction: "Officier traitant — Manifestations et risques sociaux",
    serviceCode: "POLICE",
    serviceLabel: "Police Nationale — RG",
    categorie: "securite_admin",
    classificationMax: "CD",
    perimetreBdC: "Manifestations publiques, opinions politiques",
    iconKey: "eye",
  },

  // SILAM — Service d'investigation et lutte anti-trafic
  {
    matricule: "SILAM-DIR-001",
    prenomNom: "Col. Jean-Paul EYEGHE",
    grade: "Colonel",
    role: "directeur_service",
    fonction: "Directeur SILAM",
    serviceCode: "SILAM",
    serviceLabel: "SILAM — Anti-trafic",
    categorie: "securite_admin",
    classificationMax: "TSD",
    perimetreBdC: "Trafic d'armes, contrebande, blanchiment",
    iconKey: "fileSignature",
  },
  {
    matricule: "SILAM-CHF-001",
    prenomNom: "Cdt Vincent NDEMEZO'O",
    grade: "Commandant",
    role: "chef_section",
    fonction: "Chef section lutte anti-armes",
    serviceCode: "SILAM",
    serviceLabel: "SILAM — Anti-trafic",
    categorie: "securite_admin",
    classificationMax: "SD",
    perimetreBdC: "Saisies armes légères, réseaux régionaux",
    iconKey: "users",
  },
  {
    matricule: "SILAM-001",
    prenomNom: "Cap. Sophie MOULOUNGUI",
    grade: "Capitaine",
    role: "officier_traitant",
    fonction: "Officier traitant — Réseaux contrebande Nord",
    serviceCode: "SILAM",
    serviceLabel: "SILAM — Anti-trafic",
    categorie: "securite_admin",
    classificationMax: "SD",
    perimetreBdC: "Provinces Nord — Ogooué-Ivindo, Woleu-Ntem",
    iconKey: "eye",
  },

  // DGSP — Direction Générale de la Sécurité Présidentielle
  {
    matricule: "DGSP-DIR-001",
    prenomNom: "Gén. Jean-Pierre EYEGHE",
    grade: "Général de division",
    role: "directeur_service",
    fonction: "Directeur Général de la Sécurité Présidentielle",
    serviceCode: "DGSP",
    serviceLabel: "DGSP — Sécurité Présidentielle",
    categorie: "securite_admin",
    classificationMax: "TSD",
    perimetreBdC: "Protection rapprochée Président, palais",
    iconKey: "shield",
  },
  {
    matricule: "DGSP-CHF-001",
    prenomNom: "Col. Bernard OWONO",
    grade: "Colonel",
    role: "chef_section",
    fonction: "Chef cellule renseignement DGSP",
    serviceCode: "DGSP",
    serviceLabel: "DGSP — Sécurité Présidentielle",
    categorie: "securite_admin",
    classificationMax: "SD",
    perimetreBdC: "Menaces personnelles contre l'exécutif",
    iconKey: "users",
  },
  {
    matricule: "DGSP-001",
    prenomNom: "Cdt Évelyne BIKORO",
    grade: "Commandant",
    role: "officier_traitant",
    fonction: "Officier traitant — Visites étrangères",
    serviceCode: "DGSP",
    serviceLabel: "DGSP — Sécurité Présidentielle",
    categorie: "securite_admin",
    classificationMax: "SD",
    perimetreBdC: "Visites étrangères haut niveau, sécurité hôtes",
    iconKey: "eye",
  },

  // Douane Gabonaise (cellule renseignement)
  {
    matricule: "DOUANE-DIR-001",
    prenomNom: "Insp. Christian MOUKETOU",
    grade: "Inspecteur principal des douanes",
    role: "directeur_service",
    fonction: "Chef de la cellule renseignement douanier",
    serviceCode: "DOUANE",
    serviceLabel: "Douane — Renseignement douanier",
    categorie: "securite_admin",
    classificationMax: "SD",
    perimetreBdC: "Flux commerciaux, fraude douanière",
    iconKey: "truck",
  },
  {
    matricule: "DOUANE-CHF-001",
    prenomNom: "Insp. Adj. Stéphane ENGONGA",
    grade: "Inspecteur adjoint",
    role: "chef_section",
    fonction: "Chef section ports et aéroports",
    serviceCode: "DOUANE",
    serviceLabel: "Douane — Renseignement douanier",
    categorie: "securite_admin",
    classificationMax: "CD",
    perimetreBdC: "Port-Owendo, aéroport Libreville",
    iconKey: "users",
  },
  {
    matricule: "DOUANE-001",
    prenomNom: "Brig. Nicole BENGA",
    grade: "Brigadier des douanes",
    role: "officier_traitant",
    fonction: "Officier traitant — Bureau Port-Owendo",
    serviceCode: "DOUANE",
    serviceLabel: "Douane — Renseignement douanier",
    categorie: "securite_admin",
    classificationMax: "CD",
    perimetreBdC: "Surveillance Port-Owendo, ferroviaire",
    iconKey: "eye",
  },
];

// ──────────────────────────────────────────────────────────────────────
// Catalogue complet
// ──────────────────────────────────────────────────────────────────────

export const ICNS_PERSONAS: Persona[] = [
  ...CNS_CENTRAL,
  ...RENSEIGNEMENT,
  ...FORCES_DEFENSE,
  ...SECURITE_ADMIN,
];

export const CATEGORIES: Array<{
  key: ServiceCategorie;
  label: string;
  description: string;
}> = [
  {
    key: "cns_central",
    label: "Cellule CNS centrale",
    description:
      "Secrétariat permanent, analystes, RSSI, auditeur, admin technique — pilote la plateforme.",
  },
  {
    key: "renseignement",
    label: "Services de renseignement",
    description:
      "B2, DGDI, DGR, DGSS — production du renseignement intérieur, extérieur, spécial.",
  },
  {
    key: "force_defense",
    label: "Forces de défense",
    description:
      "Garde Républicaine, Gendarmerie, Forces Armées (Terre, Air, Marine) — cellules renseignement militaires.",
  },
  {
    key: "securite_admin",
    label: "Administrations de sécurité",
    description:
      "Police RG, SILAM, DGSP, Douane — renseignement administratif et opérationnel sur le territoire.",
  },
];

export function personasByCategorie(cat: ServiceCategorie): Persona[] {
  return ICNS_PERSONAS.filter((p) => p.categorie === cat);
}

export function personasByService(serviceCode: string): Persona[] {
  return ICNS_PERSONAS.filter((p) => p.serviceCode === serviceCode);
}

export function uniqueServicesInCategorie(cat: ServiceCategorie): Array<{
  code: string;
  label: string;
}> {
  const seen = new Set<string>();
  const out: Array<{ code: string; label: string }> = [];
  for (const p of ICNS_PERSONAS) {
    if (p.categorie === cat && !seen.has(p.serviceCode)) {
      seen.add(p.serviceCode);
      out.push({ code: p.serviceCode, label: p.serviceLabel });
    }
  }
  return out;
}
