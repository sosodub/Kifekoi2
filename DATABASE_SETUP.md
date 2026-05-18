# Configuration de la base de données Kifékoi

## Problème actuel

L'inscription échoue avec l'erreur "Impossible de se connecter au serveur" car la base de données n'est pas encore démarrée.

## Solution : Démarrer la base de données Bolt

1. **Dans l'interface Bolt**, allez dans **Project Settings > Database**
2. Cliquez sur le bouton **"Start Database"** ou **"Ask Bolt to start your database"**
3. Attendez que Bolt provisionne votre base de données Supabase
4. Une fois la base créée, Bolt mettra automatiquement à jour le fichier `.env` avec les vraies credentials

## Après le démarrage de la base

Une fois que Bolt aura démarré votre base de données, les migrations seront automatiquement appliquées et vous pourrez :

- Créer de nouveaux comptes utilisateur
- Les utilisateurs pourront créer ou rejoindre des foyers
- Gérer les tâches et les membres du foyer

## Structure de la base de données

Le schéma inclut les tables suivantes :
- **profiles** : Profils utilisateurs liés aux comptes auth
- **households** : Foyers familiaux avec codes d'invitation
- **household_members** : Membres du foyer (adultes avec compte + enfants sans compte)
- **tasks** : Tâches assignées aux membres du foyer
- **task_completions** : Historique des validations de tâches

## Vérification

Pour vérifier que tout fonctionne :
1. Allez sur la page d'inscription
2. Remplissez le formulaire
3. Cliquez sur "M'inscrire"
4. Vous devriez être redirigé vers le dashboard sans erreur

En cas d'erreur réseau réelle, le message "Impossible de se connecter au serveur. Vérifiez votre connexion internet" s'affichera.
