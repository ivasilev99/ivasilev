# Hosting: AWS Frankfurt (eu-central-1)

The site is static, so the setup is a private S3 bucket in **Frankfurt (`eu-central-1`)**
behind CloudFront. Frankfurt is about 29 ms from Sofia. CloudFront also
has an edge location in Sofia, so visitors in Bulgaria get pages from a server in the same city.

```
visitor ──HTTPS──▶ CloudFront (edge in Sofia, HTTP/2+3, security headers)
                       │  Origin Access Control (signed requests)
                       ▼
                 S3 bucket, eu-central-1, private
```

Expected cost: a few cents a month (S3 storage of ~5 MB plus CloudFront requests; the CloudFront
free tier covers 1 TB and 10 M requests a month).

## Before you start

1. The account and the `cv-site` profile come from `~/repos/offcial/ivasilev-aws-org` (steps 1–4).
2. `aws sso login --profile cv-site`

## Create the infrastructure (once)

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # optional: set domain
tofu init
tofu apply
```

Without a domain, the site is live at the `url` output (`https://dxxxx.cloudfront.net`).

### With your own domain

1. Set `domain = "your-domain.tld"` in `terraform.tfvars` and run `tofu apply`.
2. The apply waits on the certificate. In a second terminal, run `tofu output acm_validation_records`
   and create those CNAMEs at your DNS provider. The apply continues once AWS sees them
   (usually within 5 minutes).
3. Point the domain at CloudFront (`tofu output dns_records`): an ALIAS/ANAME/flattened CNAME for
   the apex, and a CNAME for `www`.

## Publish the site

```bash
./infra/deploy.sh
```

The script:

1. rebuilds the pages (`node _build/build.mjs`);
2. copies only the site files to a temporary folder (git-tracked files, minus `_build/` and
   `infra/`);
3. syncs them to S3 with `--delete`. Images, fonts and PDFs are cached for a week; HTML, CSS and JS
   for 5 minutes;
4. invalidates CloudFront, so the change is visible within a minute.

## Details

| File | What |
|---|---|
| `s3.tf` | Private bucket `ivasilev-cv-site-<account-id>` with encryption and public access blocked. Only this CloudFront distribution may read it. |
| `cloudfront.tf` | Distribution, Origin Access Control, a function that maps `/projects/` to `/projects/index.html` and redirects `/projects` to `/projects/`, managed security headers, and unknown paths answered with a 404 status. |
| `acm.tf` | Certificate in `us-east-1` (a CloudFront requirement), only when `domain` is set. |
| `deploy.sh` | Build + upload + invalidate. Uses `AWS_PROFILE` if set, otherwise `cv-site`. |

State is local (`infra/terraform.tfstate`, git-ignored). Don't lose it; or move it to an S3 backend
later.
