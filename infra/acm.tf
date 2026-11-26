resource "aws_acm_certificate" "site" {
  count                     = var.domain != "" ? 1 : 0
  provider                  = aws.us_east_1
  domain_name               = var.domain
  subject_alternative_names = ["www.${var.domain}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "site" {
  count           = var.domain != "" ? 1 : 0
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.site[0].arn
}
