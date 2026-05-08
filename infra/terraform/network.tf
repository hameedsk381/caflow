resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = { Name = "caflow-${var.env}" }
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags              = { Name = "caflow-${var.env}-private-${count.index}" }
}

resource "aws_db_subnet_group" "main" {
  name       = "caflow-${var.env}"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "caflow-${var.env}"
  subnet_ids = aws_subnet.private[*].id
}

# Security group for the data plane (RDS + Redis).
# NOTE: Ingress is currently open to 0.0.0.0/0 to unblock the initial Fly.io
# deploy in Task 17. Task 17 explicitly tightens these rules to Fly.io egress
# IPs once the app is launched. Do NOT promote any env to "prod" tier with
# this rule open.
resource "aws_security_group" "data" {
  name   = "caflow-${var.env}-data"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
