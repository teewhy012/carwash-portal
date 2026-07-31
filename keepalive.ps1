try { Invoke-WebRequest -Uri 'https://carwash-api-ahl3.onrender.com/api/health' -UseBasicParsing -TimeoutSec 20 | Out-Null } catch { }
