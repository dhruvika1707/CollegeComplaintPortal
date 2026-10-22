Write-Host "Starting load test (1200 requests, concurrency 30) WITHOUT Nginx failover..."
$job = Start-Job -ScriptBlock {
    docker run --rm httpd:alpine ab -n 1200 -c 30 http://host.docker.internal:8080/
}

Start-Sleep -Milliseconds 800
Write-Host "Stopping college-backend-2 mid-flight..."
docker stop college-backend-2

$output = Receive-Job -Job $job -Wait
Write-Host $output
