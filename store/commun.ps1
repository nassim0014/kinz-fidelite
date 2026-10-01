# Fonctions partagées par les scripts du magasin. Ne pas lancer directement.
$ErrorActionPreference = 'Stop'
$Racine = Split-Path $PSScriptRoot -Parent
Set-Location $Racine

function Compose {
    docker compose -f docker-compose.store.yml --env-file .env.store @args
    if ($LASTEXITCODE -ne 0) { throw "La commande Docker a échoué (code $LASTEXITCODE)." }
}

function Verifier-Docker {
    # Windows PowerShell 5.1 turns any stderr line into an error under 'Stop': relax it here.
    $avant = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    docker info *> $null
    $code = $LASTEXITCODE
    $ErrorActionPreference = $avant
    if ($code -ne 0) {
        throw "Docker Desktop n'est pas démarré. Ouvrez Docker Desktop, attendez qu'il soit prêt, puis relancez."
    }
}
