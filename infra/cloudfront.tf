resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "ivasilev-cv-site"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# /projects/ → /projects/index.html (S3 has no directory index behind OAC);
# /projects → 301 /projects/ so relative links keep working.
resource "aws_cloudfront_function" "index" {
  name    = "ivasilev-cv-site-index"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-JS
    function handler(event) {
      var r = event.request;
      if (r.uri.endsWith('/')) {
        r.uri += 'index.html';
      } else if (r.uri.split('/').pop().indexOf('.') === -1) {
        return { statusCode: 301, statusDescription: 'Moved Permanently',
                 headers: { location: { value: r.uri + '/' } } };
      }
      return r;
    }
  JS
}

data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_response_headers_policy" "security" {
  name = "Managed-SecurityHeadersPolicy"
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  comment             = "ivasilev CV site"
  default_root_object = "index.html"
  is_ipv6_enabled     = true
  http_version        = "http2and3"
  price_class         = "PriceClass_100" # Europe + North America edges (includes Sofia)
  aliases             = var.domain != "" ? [var.domain, "www.${var.domain}"] : []

  origin {
    origin_id                = "s3"
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id           = "s3"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.optimized.id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.security.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.index.arn
    }
  }

  # Unknown paths (S3 answers 403 without ListBucket) show the home page with a 404 status.
  dynamic "custom_error_response" {
    for_each = [403, 404]
    content {
      error_code            = custom_error_response.value
      response_code         = 404
      response_page_path    = "/index.html"
      error_caching_min_ttl = 60
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.domain == ""
    acm_certificate_arn            = var.domain != "" ? aws_acm_certificate_validation.site[0].certificate_arn : null
    ssl_support_method             = var.domain != "" ? "sni-only" : null
    minimum_protocol_version       = var.domain != "" ? "TLSv1.2_2021" : null
  }
}
