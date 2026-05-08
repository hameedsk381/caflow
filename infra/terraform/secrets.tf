resource "aws_secretsmanager_secret" "app" {
  name                    = "caflow/${var.env}/app"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    SECRET_KEY   = "rotate-me"
    SENTRY_DSN   = ""
    GROQ_API_KEY = ""
  })
  lifecycle {
    ignore_changes = [secret_string]
  }
}
