# ============================================================
#  One-off cleanup after the mock-data removal.
#
#  The mock pages were deleted from git, but Windows left their directories in
#  a "delete pending" state because an editor/dev-server file watcher still
#  held handles to them. Next.js scans app/ recursively and fails with
#  EPERM on a directory it cannot open, so these must go before `next build`
#  will run.
#
#  Close VS Code (or run "Developer: Reload Window") and stop `npm run dev`
#  first, then run:
#
#      powershell -ExecutionPolicy Bypass -File scripts\cleanup-removed-dirs.ps1
#
#  Delete this script once it reports ALL CLEAR — it has no further purpose.
# ============================================================

$ErrorActionPreference = 'Continue'
Set-Location (Split-Path $PSScriptRoot -Parent)

$dirs = @(
  'app\pa\analytics',
  'app\pa\economic-calendar',
  'app\pa\exness-benefits',
  'app\pa\payments-and-wallet',
  'app\pa\settings',
  'app\pa\socialtrading',
  'app\pa\support_hub',
  'app\pa\terminal',
  'app\pa\trading',
  'app\pa\transactions',
  'app\webtrading'
)

$left = @()
foreach ($d in $dirs) {
  # Test-Path itself throws on a delete-pending directory, so ask cmd instead.
  $exists = cmd /c "if exist `"$d`" echo yes"
  if (-not $exists) { continue }

  try {
    Remove-Item -Recurse -Force $d -ErrorAction Stop
    Write-Host "removed  $d"
  } catch {
    $left += $d
  }
}

if ($left.Count -eq 0) {
  Write-Host ""
  Write-Host "ALL CLEAR - `npm run build` will work now." -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "STILL LOCKED ($($left.Count)):" -ForegroundColor Yellow
  $left | ForEach-Object { Write-Host "  $_" }
  Write-Host ""
  Write-Host "Something still holds these. Close VS Code and any 'npm run dev'," -ForegroundColor Yellow
  Write-Host "then run this script again." -ForegroundColor Yellow
}
