output "url" {
  value = var.domain != "" ? "https://${var.domain}" : "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "bucket" {
  value = aws_s3_bucket.site.id
}

output "distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "acm_validation_records" {
  description = "Create these CNAMEs at your DNS provider so the certificate can be issued."
  value = var.domain != "" ? [for o in aws_acm_certificate.site[0].domain_validation_options : {
    name  = o.resource_record_name
    type  = o.resource_record_type
    value = o.resource_record_value
  }] : []
}

output "dns_records" {
  description = "Point the domain at CloudFront (ALIAS/ANAME for the apex, CNAME for www)."
  value       = var.domain != "" ? "${var.domain} and www.${var.domain} -> ${aws_cloudfront_distribution.site.domain_name}" : "none (no custom domain)"
}
