variable "aws_region" {
  description = "AWS region for all resources. Mumbai for data residency."
  type        = string
  default     = "ap-south-1"
}

variable "env" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "db_password" {
  description = "RDS Postgres master password. Pass via TF_VAR_db_password env var."
  type        = string
  sensitive   = true
}
