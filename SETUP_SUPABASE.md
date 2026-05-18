# Configuration Supabase pour Kifékoi

## Étapes pour activer la base de données

### 1. Accéder au Dashboard Supabase

Connectez-vous à votre projet Supabase : https://0ec90b57d6e95fcbda19832f.supabase.co

### 2. Exécuter les migrations SQL

1. Dans le Dashboard Supabase, allez dans **SQL Editor**
2. Copiez tout le contenu du fichier `src/db/migrations.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur **Run** pour exécuter toutes les migrations

### 3. Vérifier la création des tables

Dans le Dashboard, allez dans **Table Editor** et vérifiez que ces tables existent :
- `profiles`
- `households`
- `household_members`
- `tasks`
- `task_completions`

### 4. Architecture de la base de données

#### **profiles**
- Lié à `auth.users`
- Contient les informations personnelles de l'utilisateur
- RLS : chaque utilisateur ne peut voir que son propre profil

#### **households**
- Représente un foyer
- Contient un `invite_code` unique pour inviter d'autres membres
- RLS : accessible uniquement aux membres du foyer

#### **household_members**
- Tous les membres visibles sur "Mon foyer"
- Adultes : `user_id` NOT NULL (lié à un compte)
- Enfants : `user_id` NULL (sans téléphone)
- Rôles : `owner`, `adult`, `child`
- RLS : visible uniquement aux membres du même foyer

#### **tasks**
- Tâches d'un foyer
- Peuvent être assignées à un membre ou non assignées
- Statut : `pending` ou `done`
- RLS : accessible uniquement aux membres du foyer

#### **task_completions**
- Historique de validation des tâches
- Enregistre qui a fait la tâche et qui l'a validée
- RLS : accessible uniquement aux membres du foyer

### 5. Fonctionnalités automatiques

#### Trigger de création de profil
Lorsqu'un utilisateur s'inscrit via Supabase Auth, un profil est automatiquement créé dans la table `profiles` avec les informations fournies lors de l'inscription.

#### Génération de code d'invitation
La fonction `generate_invite_code()` génère un code unique de 6 caractères alphanumériques pour inviter des membres dans un foyer.

### 6. Sécurité RLS

Toutes les tables ont Row Level Security (RLS) activé avec des politiques strictes :

- **Isolation multi-foyer** : Un utilisateur ne peut voir que les données des foyers dont il est membre
- **Contrôle des rôles** : Seuls les adultes (`owner` ou `adult`) peuvent créer/modifier/supprimer certaines données
- **Protection des données personnelles** : Chaque utilisateur ne peut accéder qu'à son propre profil

### 7. Utilisation dans l'application

Les fonctions helper sont disponibles dans :
- `src/db/auth.ts` - Authentification (signUp, signIn, signOut)
- `src/db/households.ts` - Gestion des foyers (créer, rejoindre, lister)
- `src/db/tasks.ts` - Gestion des tâches (créer, modifier, compléter)

Le client Supabase est configuré dans `src/services/supabase.ts` et utilise les variables d'environnement du fichier `.env`.

## Test de sécurité RLS

Pour tester l'isolation multi-foyer :
1. Créez 2 comptes utilisateurs différents
2. Créez un foyer avec chaque compte
3. Vérifiez que chaque utilisateur ne peut voir que son propre foyer et ses tâches
4. Aucune fuite de données ne doit être possible entre les foyers
