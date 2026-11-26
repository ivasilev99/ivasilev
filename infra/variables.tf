variable "region" {
  type        = string
  description = "Where the files live. Milan has the lowest latency to Bulgaria of all AWS regions (opt-in region: enabled by ivasilev-aws-org)."
  default     = "eu-south-1"
}

variable "aws_profile" {
  type    = string
  default = "cv-site"
}

variable "domain" {
  type        = string
  description = "Optional custom domain, e.g. ivasilev.dev. Empty = use the *.cloudfront.net address."
  default     = ""
}
