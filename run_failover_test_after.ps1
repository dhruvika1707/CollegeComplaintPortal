Write-Host "Configuring Nginx with Resilient High-Availability Failover (proxy_next_upstream)..."
Copy-Item -Path nginx\nginx-3instances.conf -Destination nginx\nginx.conf -Force
docker compose start backend2
docker compose exec nginx nginx -s reload
Start-Sleep -Seconds 2

Write-Host "Starting load test (1200 requests, concurrency 30) WITH Nginx failover..."
$job = Start-Job -ScriptBlock {
    docker run --rm httpd:alpine ab -n 1200 -c 30 http://host.docker.internal:8080/
}

Start-Sleep -Milliseconds 800
Write-Host "Stopping college-backend-2 mid-flight..."
docker stop college-backend-2

$output = Receive-Job -Job $job -Wait
Write-Host $output
