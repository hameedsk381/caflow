terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
  backend "s3" {
    # bucket, key, region set via -backend-config or terraform.tfvars at init time
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project = "caflow"
      Env     = var.env
      Owner   = "vinay"
    }
  }
}
