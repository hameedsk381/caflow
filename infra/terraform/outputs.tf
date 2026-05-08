output "db_endpoint" {
  description = "RDS Postgres endpoint hostname"
  value       = aws_db_instance.main.address
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint hostname"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "secrets_arn" {
  value = aws_secretsmanager_secret.app.arn
}
