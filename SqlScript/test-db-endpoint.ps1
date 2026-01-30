$ErrorActionPreference = 'Stop'

$projDir = "E:\Patel Infotech Services\Mobiebook\Codebase (MobieBook)\Code\API\PhotoMateAPI"

$api = Start-Process -FilePath "dotnet" -ArgumentList @('run','--urls','http://localhost:5000') -WorkingDirectory $projDir -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 6

try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5000/api/Common/GetCountryDetail' -TimeoutSec 20
    Write-Host 'DB endpoint response:'
    Write-Host $response.Content
}
catch {
    Write-Host 'DB endpoint error:'
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
finally {
    try {
        Stop-Process -Id $api.Id -Force -ErrorAction SilentlyContinue
    } catch {}
}
