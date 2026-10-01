# Restaure une sauvegarde. ATTENTION : remplace toutes les données actuelles.
# Usage : powershell -ExecutionPolicy Bypass -File store\restaurer.ps1 -Fichier backups\kinz-2026-10-01_2100.dump
param([Parameter(Mandatory = $true)][string]$Fichier)
. "$PSScriptRoot\commun.ps1"
Verifier-Docker
if (-not (Test-Path $Fichier)) { throw "Fichier introuvable : $Fichier" }
$ok = Read-Host "Toutes les données actuelles seront remplacées par $Fichier. Taper OUI pour continuer"
if ($ok -ne 'OUI') { Write-Host "Annulé."; exit 1 }
Compose cp $Fichier db:/tmp/restauration.dump
Compose exec -T db pg_restore -U kinz -d kinz --clean --if-exists /tmp/restauration.dump
Write-Host "Restauration terminée." -ForegroundColor Green
