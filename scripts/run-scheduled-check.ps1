# Runs one scheduled source check on this Windows machine. Called by the "GovernIT-Sources" task.
# Needs Docker Desktop running (it starts the Postgres container if it is stopped).
$ErrorActionPreference = "Continue"
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
New-Item -ItemType Directory -Force (Join-Path $repo "logs") | Out-Null
$log = Join-Path $repo "logs\sources.log"

"`n=== $(Get-Date -Format s) scheduled check ===" | Out-File -Append -Encoding utf8 $log
docker compose up -d postgres 2>&1 | Out-File -Append -Encoding utf8 $log
npm run sources:check 2>&1 | Out-File -Append -Encoding utf8 $log
