# Crée un compte propriétaire.
# Usage : powershell -ExecutionPolicy Bypass -File store\creer-proprietaire.ps1 -Nom "Nassim" -Pin 123456
param(
    [Parameter(Mandatory = $true)][string]$Nom,
    [Parameter(Mandatory = $true)][string]$Pin
)
. "$PSScriptRoot\commun.ps1"
Verifier-Docker
if ($Pin -notmatch '^\d{6}$') { throw "Le PIN doit contenir exactement 6 chiffres." }
Compose run --rm tools npm run db:seed-owner -- $Nom $Pin
