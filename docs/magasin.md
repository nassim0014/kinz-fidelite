# Installer KINZ Fidélité sur le PC du magasin (Windows)

L'application tourne sur le PC du magasin. Les téléphones connectés au **Wi-Fi du magasin**
l'ouvrent directement :

| Qui | Adresse | Sécurité |
|---|---|---|
| Clients | `http://<adresse du PC>/rejoindre` et leur carte | Aucun avertissement |
| Équipe | `https://<adresse du PC>/staff` | Avertissement à accepter **une fois** par téléphone, puis le scan caméra fonctionne |
| Propriétaires | `https://<adresse du PC>/admin` | Idem |

> Les cartes ne sont consultables que depuis le Wi-Fi du magasin, pas depuis la maison.
> Les tampons, eux, sont toujours enregistrés au comptoir.

## 1. Préparer le PC (une seule fois)

1. **Installer Docker Desktop** (docker.com), redémarrer, puis l'ouvrir et attendre « Engine running ».
   Dans ses réglages, cocher **« Start Docker Desktop when you sign in »**.
2. **Donner une adresse fixe au PC** dans la box/routeur (« réservation DHCP », « bail statique »),
   par exemple `192.168.1.50`. Sans cela, l'adresse peut changer et les QR codes imprimés ne
   marcheront plus.
3. **Installer Git for Windows** (git-scm.com), puis dans PowerShell :
   ```powershell
   cd $HOME\Documents
   git clone https://github.com/nassim0014/kinz-fidelite.git
   cd kinz-fidelite
   ```
   Une fenêtre GitHub demande de se connecter : c'est normal, le dépôt est privé.

## 2. Démarrer

```powershell
powershell -ExecutionPolicy Bypass -File store\demarrer.ps1
```

- **Au premier lancement**, le script demande l'adresse fixe du PC et crée le fichier
  `.env.store`, qui contient l'adresse et des mots de passe générés automatiquement.
  **Gardez une copie de ce fichier avec vos sauvegardes.**
- La première construction prend 5 à 10 minutes.
- Si Windows demande d'autoriser Docker sur le réseau, acceptez pour les **réseaux privés**.
- Ensuite, tout redémarre tout seul avec le PC, tant que Docker Desktop se lance à l'ouverture
  de session.

**Créer le compte propriétaire :**

```powershell
powershell -ExecutionPolicy Bypass -File store\creer-proprietaire.ps1 -Nom "Nassim" -Pin 123456
```

Puis, depuis un téléphone sur le Wi-Fi : `https://<adresse du PC>/admin`. Acceptez
l'avertissement (« Paramètres avancés » → « Continuer »), connectez-vous, ajoutez l'équipe, puis
**imprimez l'affiche** depuis `https://<adresse du PC>/admin/affiche`.

## 3. Sauvegardes (indispensable)

Toutes les données sont sur ce PC. Pour faire une sauvegarde :

```powershell
powershell -ExecutionPolicy Bypass -File store\sauvegarder.ps1
```

Le script crée un fichier dans `backups\` et garde les 30 plus récents. **Programmez-le chaque
soir** (une seule fois, PowerShell en administrateur, depuis le dossier du projet) :

```powershell
schtasks /create /tn "KINZ sauvegarde" /sc daily /st 21:00 /tr "powershell -ExecutionPolicy Bypass -File `"$PWD\store\sauvegarder.ps1`""
```

Copiez régulièrement `backups\` et `.env.store` sur une clé USB ou un cloud.

Pour restaurer (cela remplace toutes les données actuelles) :

```powershell
powershell -ExecutionPolicy Bypass -File store\restaurer.ps1 -Fichier backups\kinz-AAAA-MM-JJ_HHMM.dump
```

## 4. Mettre à jour l'application

```powershell
git pull
powershell -ExecutionPolicy Bypass -File store\demarrer.ps1
```

Les changements de base de données s'appliquent automatiquement avant le redémarrage.

## En cas de problème

| Symptôme | Cause probable / solution |
|---|---|
| Les téléphones n'ouvrent pas la page | Vérifier qu'ils sont sur le **même Wi-Fi** que le PC (pas le Wi-Fi invité). Certaines box bloquent la communication entre appareils (« isolation des clients ») : la désactiver. Vérifier le pare-feu Windows (réseau privé autorisé). |
| Le QR code mène à une mauvaise adresse | L'adresse du PC a changé : la fixer dans la box, corriger `STORE_HOST` dans `.env.store`, relancer `demarrer.ps1` et réimprimer l'affiche. |
| La caméra ne s'ouvre pas sur le téléphone de l'équipe | Utiliser `https://` (et non `http://`) pour `/staff`, puis autoriser la caméra. Sinon, rechercher le client par téléphone. |
| « Docker Desktop n'est pas démarré » | Ouvrir Docker Desktop, attendre « Engine running », relancer. |
| Arrêter l'application | `powershell -ExecutionPolicy Bypass -File store\arreter.ps1`. Les données sont conservées. |
