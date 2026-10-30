# Instala el kit en ESTA computadora Windows para todas las sesiones de Claude Code (scope usuario).
# Uso (PowerShell):  powershell -ExecutionPolicy Bypass -File .\instalar.ps1
#                    powershell -ExecutionPolicy Bypass -File .\instalar.ps1 -Quitar ruflo-core@ruflo
param([string]$Quitar = "")
$ErrorActionPreference = "Continue"
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { Write-Host "Falta Claude Code (comando 'claude')."; exit 1 }
if ($Quitar) { claude plugin uninstall $Quitar --scope user; exit }

$repo = if ($env:KIT_REPO) { $env:KIT_REPO } else { "chiquidg1234-hue/claude-kit" }
$marketplaces = @($repo, "JuliusBrussee/caveman", "obra/superpowers-marketplace", "bradautomates/claude-video",
                  "anthropics/claude-plugins-official", "ruvnet/ruflo")
foreach ($m in $marketplaces) { claude plugin marketplace add $m }

$plugins = @("mi-kit@mi-kit", "caveman@caveman", "superpowers@superpowers-marketplace", "watch@claude-video",
             "claude-code-setup@claude-plugins-official", "playwright@claude-plugins-official",
             "context7@claude-plugins-official", "firecrawl@claude-plugins-official", "ruflo-core@ruflo")
foreach ($p in $plugins) {
  claude plugin install $p --scope user
  if ($LASTEXITCODE -ne 0) { Write-Host "!! falló $p" }
}

if (Get-Command npm -ErrorAction SilentlyContinue) { npm i -g agent-browser } else { Write-Host "!! agent-browser necesita Node.js (npm)" }

Write-Host ""
Write-Host "Listo. Falta poner tus keys como variables de entorno de usuario (NO en este repo), por ejemplo:"
Write-Host '  [Environment]::SetEnvironmentVariable("APIFY_TOKEN", "pega-aqui", "User")'
Write-Host "Variables: APIFY_TOKEN, FIRECRAWL_API_KEY, GEMINI_API_KEY (para watch). Luego cierra y abre la terminal."
claude plugin list
