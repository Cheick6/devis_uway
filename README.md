# Devis Sécurité - Application Mobile React Native

Application mobile complète pour la gestion des devis de sécurité privée avec export PDF et Excel.

## 🚀 Fonctionnalités

### 📋 Gestion des Devis
- **Informations client** : Nom, adresse du chantier, référence devis auto-générée
- **Postes de travail** : Ajout illimité de postes avec horaires jour/nuit configurables
- **Tarification** : Taux de base modifiable (22-24€/h) avec majorations automatiques
- **Jours fériés** : Calcul automatique des jours fériés français + ajout personnalisé
- **Tableau de décomposition** : Calcul jour par jour avec totaux détaillés

### 💰 Calcul des Majorations
- **Heure de jour — semaine** : 0%
- **Heure de nuit — semaine** : +10%
- **Heure de jour — dimanche** : +10%
- **Heure de nuit — dimanche** : +20%
- **Heure de jour — férié** : +100%
- **Heure de nuit — férié** : +100%

### 📊 Export Professionnel
- **PDF** : Devis complet avec en-tête société, tableau détaillé, conditions générales
- **Excel** : 3 feuilles (Détail, Récapitulatif, Paramètres)
- **Design** : Chartreuse bleu marine/gris/orange, Oswald + Source Sans Pro

### 💾 Sauvegarde
- **Auto-sauvegarde** : AsyncStorage à chaque modification
- **Historique** : 5 derniers devis avec accès rapide
- **Import/Export** : Configuration JSON

## 🏗️ Architecture

```
src/
├── app/                        # Navigation (Expo Router)
│   └── index.tsx
├── components/
│   ├── devis/                  # Composants métier
│   │   ├── ClientForm.tsx      # Section 1 : infos client
│   │   ├── PosteForm.tsx       # Section 2 : saisie poste
│   │   ├── PosteList.tsx       # Liste des postes
│   │   ├── TarifConfig.tsx     # Section 3 : taux et majorations
│   │   ├── FeriesManager.tsx   # Section 4 : jours fériés
│   │   └── DevisTable.tsx      # Section 5 : tableau décomposition
│   └── ui/                     # Composants réutilisables
│       ├── Button.tsx
│       ├── InputField.tsx
│       ├── SectionCard.tsx
│       └── ShiftChip.tsx
├── hooks/
│   ├── useDevisCalculation.ts  # Logique de calcul
│   └── useDevisStorage.ts      # Stockage AsyncStorage
├── utils/
│   ├── calcul.ts               # Fonctions pures de calcul
│   ├── feries.ts               # Jours fériés français
│   ├── exportPDF.ts            # Génération PDF
│   └── exportExcel.ts          # Génération Excel
├── types/
│   └── devis.ts                # Types TypeScript
└── constants/
    └── taux.ts                 # Taux et constantes
```

## � Docker (Recommandé pour éviter les problèmes)

### Prérequis
- Docker et Docker Compose installés
- Git

### Lancement avec Docker
```bash
# 1. Cloner le projet
git clone <votre-repo>
cd devis_uway

# 2. Lancer avec Docker Compose
docker-compose up --build

# 3. Accéder à l'application
# Web: http://localhost:8082
# Expo Go: Scanner le QR code dans le terminal
```

### Avantages de Docker
- ✅ Environnement isolé et reproductible
- ✅ Pas de conflit de dépendances
- ✅ Compatible Windows/Mac/Linux
- ✅ Développement instantané

## �🛠️ Installation Manuelle

### Prérequis
- Node.js 16+
- Expo CLI
- React Native development environment

### Installation des dépendances
```bash
npm install
```

### Lancement de l'application
```bash
# Démarrer le serveur de développement
npm start

# Lancer sur iOS
npm run ios

# Lancer sur Android
npm run android

# Lancer sur Web
npm run web
```

## 📱 Utilisation

### 1. Création d'un devis
1. Remplir les informations client (Section "Client")
2. Ajouter des postes de travail (Section "Postes")
3. Configurer les tarifs si nécessaire (Section "Tarifs")
4. Vérifier les jours fériés (Section "Jours fériés")
5. Consulter le tableau de décomposition (Section "Tableau")

### 2. Configuration d'un poste
- **Libellé** : Nom du poste (ex: "Surveillance hall A")
- **Dates** : Période de travail
- **Agents** : Nombre d'agents affectés
- **Horaires** : Jour (6h-22h) et/ou Nuit (22h-6h)
- **Jours** : Sélection des jours travaillés

### 3. Export
- **PDF** : Devis complet prêt à envoyer
- **Excel** : Fichier détaillé pour analyse

## 🔧 Configuration

### Taux par défaut
- Taux de base : 23€/h
- TVA : 0% (configurable)
- Validité devis : 30 jours

### Personnalisation
- Tous les taux sont modifiables dans l'interface
- Jours fériés personnalisés possibles
- Conditions générales éditables

## 📝 Exemple de calcul

**Poste : "Sécurité entrée", 2 agents, du 24 au 26 déc**
- Horaires : 08h00→20h00 (jour) + 20h00→08h00 (nuit)
- Taux de base : 23€/h

**Résultats :**
- 24 déc (semaine) : 1 159,20€ HT
- 25 déc (férié) : 2 208,00€ HT  
- 26 déc (dimanche) : 1 269,60€ HT
- **Total HT = 4 636,80€**

## 🎨 Design

### Palette de couleurs
- Bleu marine : `#0A1628`
- Gris acier : `#4A5568`
- Blanc cassé : `#F7F8FA`
- Orange accent : `#E85D04`

### Typographie
- Oswald (titres)
- Source Sans Pro (corps de texte)

## 🔍 Développement

### TypeScript strict
- Aucun type `any`
- Types centralisés dans `types/devis.ts`
- Composants typés

### Architecture
- **Hooks métier** : Logique séparée des composants
- **Utilitaires purs** : Fonctions testables
- **Composants UI** : Réutilisables et stylés

### Tests
- Fonctions de calcul pures et testables
- Architecture propice aux tests unitaires

## 📦 Dépendances principales

- **React Native** : Framework mobile
- **Expo** : Outils de développement
- **TypeScript** : Typage strict
- **Zustand** : État global (optionnel)
- **AsyncStorage** : Stockage local
- **HTML-to-PDF** : Export PDF
- **XLSX** : Export Excel

## 🚀 Déploiement

### Build de production
```bash
# Build iOS
expo build:ios

# Build Android
expo build:android

# Build Web
expo build:web
```

### Publication
```bash
# Publication sur Expo
expo publish
```

## 📄 Licence

Projet créé pour les besoins d'une société de sécurité privée.

## 🤝 Contribuer

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou amélioration, contacter le développeur.

---

**Développé avec ❤️ en React Native + TypeScript**
