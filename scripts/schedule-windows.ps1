# Registers (or removes) an hourly Windows scheduled task that checks the official sources.
#   powershell -ExecutionPolicy Bypass -File scripts\schedule-windows.ps1           # install / update
#   powershell -ExecutionPolicy Bypass -File scripts\schedule-windows.ps1 -Remove   # uninstall
# Runs as the current user, only while you are logged in. Each source still respects its own
# check interval, so an hourly trigger never hits a site more often than configured.
param([switch]$Remove)

$name = "GovernIT-Sources"
if ($Remove) {
  Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue
  Write-Output "Removed scheduled task $name"
  exit 0
}

$script = Join-Path $PSScriptRoot "run-scheduled-check.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Hours 1)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 20)
Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings -Description "GovernIT: check official exam/notice sources hourly" -Force | Out-Null
Write-Output "Registered scheduled task $name (hourly). Log: logs\sources.log"
