# WP-Control-Suite — Bootstrap Harness

Deze map bevat de **bootstrap** voor WP-Control-Suite. Lever de **werkelijke code** (ZIP/TAR) aan en draai:

```bash
# Zet code-archive neer als: /root/wp-control-suite.zip (of .tar.gz)
bash scripts/40_wpctl_bootstrap.sh
# activeer daarna met profile:
docker compose -f docker-compose.wpctl.yml --profile wpctl build --no-cache
docker compose -f docker-compose.wpctl.yml --profile wpctl up -d wp-control-suite
```
