# Sauvegarde la base dans le dossier "backups" (garde les 30 plus récentes).
# Usage : powershell -ExecutionPolicy Bypass -File store\sauvegarder.ps1
. "$PSScriptRoot\commun.ps1"
Verifier-Docker
New-Item -ItemType Directory -Force backups | Out-Null
$fichier = "backups\kinz-$(Get-Date -Format 'yyyy-MM-dd_HHmm').dump"
Compose exec -T db sh -c 'pg_dump -U kinz -Fc kinz > /tmp/sauvegarde.dump'
Compose cp db:/tmp/sauvegarde.dump $fichier
Get-ChildItem backups -Filter 'kinz-*.dump' | Sort-Object Name -Descending | Select-Object -Skip 30 | Remove-Item
Write-Host "Sauvegarde créée : $fichier" -ForegroundColor Green
Write-Host "Copiez régulièrement le dossier backups (et .env.store) sur une clé USB ou un cloud."
