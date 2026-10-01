# Arrête KINZ Fidélité (les données sont conservées).
. "$PSScriptRoot\commun.ps1"
Verifier-Docker
Compose stop
Write-Host "Arrêté. Relancer avec store\demarrer.ps1."
