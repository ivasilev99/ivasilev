variable "region" {
  type        = string
  description = "Where the files live. Frankfurt: enabled by default, ~29 ms from Sofia."
  default     = "eu-central-1"
}

variable "aws_profile" {
  type    = string
  default = "ivasilev"
}

variable "domain" {
  type        = string
  description = "Optional custom domain, e.g. ivasilev.dev. Empty = use the *.cloudfront.net address."
  default     = ""
}
