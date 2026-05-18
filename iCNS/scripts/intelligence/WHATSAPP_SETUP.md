# 📱 WhatsApp Monitor - Guide de Déploiement

## ⚠️ AVERTISSEMENTS IMPORTANTS

### Risques & Conformité
- **Risque de ban WhatsApp** : WhatsApp interdit l'utilisation de bots non officiels
- **Terms of Service** : Utilisation en violation des TOS WhatsApp
- **Légalité** : Réservé aux autorités compétentes avec mandat légal
- **RGPD** : Les auteurs des messages sont hashés pour anonymat

### Recommandations de Sécurité
1. ✅ **Numéro dédié OBLIGATOIRE** : Ne JAMAIS utiliser votre numéro principal
2. ✅ **Carte SIM prépayée** : Acheter une SIM jetable (GabonTelecom, Airtel, Moov)
3. ✅ **Téléphone secondaire** : Android rooté de préférence (pour WhatsApp Business)
4. ✅ **VPN** : Utiliser un VPN pour masquer l'origine des requêtes
5. ✅ **Usage modéré** : Limiter à 2-3 groupes max pour éviter la détection

---

## 📋 Prérequis

### Matériel
- 📱 Smartphone Android (de préférence)
- 💳 Carte SIM prépayée gabonaise (5000 FCFA)
- 🖥️ Serveur Linux VPS (OVH, DigitalOcean, Vultr...)

### Logiciels
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Dépendances
cd scripts/intelligence
npm install whatsapp-web.js qrcode-terminal dotenv
```

---

## 🚀 Installation Pas-à-Pas

### Étape 1 : Préparation du Numéro

1. **Acheter une SIM**
   - GabonTelecom Prepaid : ~2000 FCFA
   - Airtel/Moov : ~3000 FCFA

2. **Activer WhatsApp**
   - Installer WhatsApp sur téléphone secondaire
   - Enregistrer avec le nouveau numéro
   - Compléter le profil (photo, nom neutre : "Infos 241")

3. **Rejoindre les Groupes Cibles**
   - Ne rejoignez PAS trop de groupes d'un coup (max 2 par jour)
   - Privilégiez les groupes publics trouvés sur Facebook
   - Groupes recommandés :
     - "Le Gabon d'abord"
     - "Infos Kinguélé"
     - "Tamtam Gabon"
     - Groupes de quartiers (PK8, Nzeng-Ayong, Akanda...)

### Étape 2 : Configuration du Script

1. **Éditer `whatsapp_monitor.js`**

Mettre à jour les groupes à surveiller (ligne ~70) :

```javascript
// Liste des IDs de groupes WhatsApp à surveiller
const MONITORED_GROUPS = [
    '12345678901234567@g.us',  // Le Gabon d'abord
    '98765432109876543@g.us',  // Infos Kinguélé
    // Ajouter vos groupes ici
];
```

**Comment trouver les IDs de groupes ?**
- Lancez le script une fois en mode debug
- Il affichera les IDs de tous les groupes auxquels vous appartenez
- Copiez les IDs pertinents

2. **Configurer `.env`**

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

### Étape 3 : Premier Lancement (Local)

```bash
cd scripts/intelligence
node whatsapp_monitor.js
```

**Processus** :
1. Un QR code s'affiche dans le terminal
2. Ouvrir WhatsApp sur votre téléphone
3. Paramètres → Appareils connectés → Connecter un appareil
4. Scanner le QR code
5. Le script dit "Client is ready!" après 10-15 secondes

**Première fois** : Laissez tourner 5 minutes pour que la session se stabilise.

### Étape 4 : Déploiement Production (VPS)

#### Option A : Systemd Service (Linux)

1. Créer le service :

```bash
sudo nano /etc/systemd/system/lynx-whatsapp.service
```

Contenu :
```ini
[Unit]
Description=Lynx Eye - WhatsApp Monitor
After=network.target

[Service]
Type=simple
User=votre_user
WorkingDirectory=/path/to/scripts/intelligence
ExecStart=/usr/bin/node whatsapp_monitor.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/lynx_whatsapp.log
StandardError=append:/var/log/lynx_whatsapp_error.log

[Install]
WantedBy=multi-user.target
```

2. Activer et démarrer :

```bash
sudo systemctl daemon-reload
sudo systemctl enable lynx-whatsapp
sudo systemctl start lynx-whatsapp
sudo systemctl status lynx-whatsapp
```

#### Option B : PM2 (Node.js Process Manager)

```bash
# Installer PM2
npm install -g pm2

# Lancer le monitor
cd scripts/intelligence
pm2 start whatsapp_monitor.js --name lynx-whatsapp

# Auto-restart au boot
pm2 startup
pm2 save

# Monitoring
pm2 logs lynx-whatsapp
pm2 status
```

---

## 📊 Monitoring & Maintenance

### Vérifier les Logs

```bash
# Systemd
sudo journalctl -u lynx-whatsapp -f

# PM2
pm2 logs lynx-whatsapp

# Fichier de log direct
tail -f /var/log/lynx_whatsapp.log
```

### Redémarrer en Cas de Problème

```bash
# Systemd
sudo systemctl restart lynx-whatsapp

# PM2
pm2 restart lynx-whatsapp
```

### Session WhatsApp Expirée ?

Si le script ne reçoit plus de messages :

1. Arrêter le service
2. Supprimer `.wwebjs_auth/`
3. Redémarrer et rescanner le QR code

```bash
pm2 stop lynx-whatsapp
rm -rf .wwebjs_auth
pm2 start lynx-whatsapp
# Rescanner le QR
```

---

## 🔒 Sécurité Opérationnelle

### Bonnes Pratiques

✅ **Faire** :
- Utiliser un VPN permanent sur le serveur
- Hasher les auteurs (déjà implémenté)
- Limiter à 3-5 groupes maximum
- Surveiller les logs quotidiennement
- Avoir un numéro de backup prêt

❌ **Ne JAMAIS** :
- Envoyer des messages depuis le bot (bannissement instantané)
- Rejoindre >10 groupes avec le même numéro
- Partager publiquement ce système
- Utiliser votre numéro personnel
- Stocker les messages en clair (déjà hashés)

### Plan B en Cas de Ban

1. **Préparer une 2ème SIM** en avance
2. **Dupliquer le setup** sur un 2ème serveur
3. **Alterner** entre les deux toutes les 2 semaines

---

## 🐛 Troubleshooting

### Problème : QR Code ne s'affiche pas

```bash
# Vérifier que qrcode-terminal est installé
npm list qrcode-terminal

# Réinstaller si nécessaire
npm install qrcode-terminal
```

### Problème : "Session closed"

⚠️ Votre session WhatsApp a expiré ou le numéro est banni.

**Solution** :
```bash
rm -rf .wwebjs_auth
node whatsapp_monitor.js  # Rescanner le QR
```

### Problème : Aucun message reçu

Causes possibles :
- Les groupes ne sont pas dans `MONITORED_GROUPS[]`
- Les keywords ne matchent pas les messages
- Le numéro n'est plus dans les groupes

**Debug** :
```javascript
// Activer le mode debug (ligne 20)
const DEBUG = true;
```

---

## 📈 Métriques de Succès

| KPI | Objectif |
|-----|----------|
| Uptime | >95% |
| Messages/jour | 50-200 |
| False positives | <20% |
| Temps de latence | <5s |
| Durée avant ban | >30 jours |

---

## ⚖️ Cadre Légal

**RAPPEL** : L'utilisation de ce système doit être conforme à :
- Loi gabonaise sur les interceptions
- Mandat judiciaire ou autorisation présidentielle
- Respect du secret des correspondances (Art. 17 Constitution)

**Usage strictement réservé** : Services de sécurité nationale habilités.

---

**Dernière mise à jour** : 24 Novembre 2024  
**Contact support** : Équipe Dev Présidence (interne uniquement)
