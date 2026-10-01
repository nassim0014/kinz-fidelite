# Démarre (ou met à jour) KINZ Fidélité sur le PC du magasin.
# Usage : powershell -ExecutionPolicy Bypass -File store\demarrer.ps1
. "$PSScriptRoot\commun.ps1"
Verifier-Docker

function Secret([int]$Octets) {
    $b = New-Object byte[] $Octets
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
    return ([Convert]::ToBase64String($b) -replace '[+/=]', '')
}

if (-not (Test-Path .env.store)) {
    Write-Host "Première installation : configuration du magasin." -ForegroundColor Cyan
    $ips = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notlike '*vEthernet*' -and $_.InterfaceAlias -notlike '*WSL*' } |
        Select-Object -ExpandProperty IPAddress
    Write-Host "Adresses de ce PC sur le réseau : $($ips -join ', ')"
    $ip = Read-Host "Adresse IP FIXE de ce PC sur le Wi-Fi du magasin (ex. 192.168.1.50)"
    if ($ip -notmatch '^\d{1,3}(\.\d{1,3}){3}$') { throw "Adresse invalide : $ip" }
    @(
        "STORE_HOST=$ip",
        "POSTGRES_PASSWORD=$(Secret 24)",
        "SESSION_SECRET=$(Secret 48)"
    ) | Set-Content -Encoding ascii .env.store
    Write-Host ".env.store créé. Gardez une copie de ce fichier avec vos sauvegardes." -ForegroundColor Green
}

$hote = (Get-Content .env.store | Where-Object { $_ -like 'STORE_HOST=*' }) -replace 'STORE_HOST=', ''
Write-Host "Construction et démarrage (la première fois, comptez 5 à 10 minutes)..." -ForegroundColor Cyan
Compose up -d --build

Write-Host ""
Write-Host "KINZ Fidélité est en ligne sur le Wi-Fi du magasin :" -ForegroundColor Green
Write-Host "  Clients      : http://$hote/rejoindre"
Write-Host "  Équipe       : https://$hote/staff   (accepter l'avertissement de sécurité une fois par téléphone)"
Write-Host "  Propriétaire : https://$hote/admin   (affiche QR : https://$hote/admin/affiche)"
