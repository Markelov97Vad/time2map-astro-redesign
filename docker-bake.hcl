group "default" {
  targets = ["web", "app"]
}

target "docker-metadata-action-web" {}
target "docker-metadata-action-app" {}

target "web" {
  inherits = ["docker-metadata-action-web"]
  context = "."
  dockerfile = "Dockerfile"
  target = "web"
  cache-from = ["type=gha,scope=t2m-v2"]
  cache-to = ["type=gha,mode=max,scope=t2m-v2"]
}

target "app" {
  inherits = ["docker-metadata-action-app"]
  context = "."
  dockerfile = "Dockerfile"
  target = "app"
  cache-from = ["type=gha,scope=t2m-v2"]
  cache-to = ["type=gha,mode=max,scope=t2m-v2"]
}
