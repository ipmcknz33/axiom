$ErrorActionPreference = "Stop"

function Stop-PortProcess {
  param(
    [int]$Port
  )

  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if (-not $connections) {
    return
  }

  $ownedProcessIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($ownedProcessId in $ownedProcessIds) {
    try {
      $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$ownedProcessId" -ErrorAction SilentlyContinue
      if (-not $proc) {
        continue
      }

      # Only stop Node/Next related listeners to avoid killing unrelated apps.
      if ($proc.Name -match '^node(\.exe)?$' -or $proc.CommandLine -match 'next\\dist\\server\\lib\\start-server.js') {
        Stop-Process -Id $ownedProcessId -Force -ErrorAction SilentlyContinue
        Write-Host "[dev-stable] Stopped PID $ownedProcessId on port $Port"
      }
    } catch {
      Write-Host "[dev-stable] Warning: unable to stop PID $ownedProcessId on port $Port"
    }
  }
}

Write-Host "[dev-stable] Preparing stable localhost:3000 startup..."

Stop-PortProcess -Port 3000
Stop-PortProcess -Port 3001

try {
  cmd /c "attrib +P /S /D *" | Out-Null
} catch {
  Write-Host "[dev-stable] Warning: OneDrive pinning skipped"
}

if (Test-Path ".next") {
  try {
    Remove-Item -Recurse -Force ".next"
    Write-Host "[dev-stable] Cleared .next cache"
  } catch {
    Write-Host "[dev-stable] Warning: unable to clear .next cache"
  }
}

$env:NEXT_DISABLE_TURBOPACK = "1"

Write-Host "[dev-stable] Starting Next.js on http://localhost:3000"
npm run dev:next
