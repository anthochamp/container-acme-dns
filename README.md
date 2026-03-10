# Acme DNS Container

![GitHub License](https://img.shields.io/github/license/anthochamp/container-acme-dns?style=for-the-badge)
![GitHub Release](https://img.shields.io/github/v/release/anthochamp/container-acme-dns?style=for-the-badge&color=457EC4)
![GitHub Release Date](https://img.shields.io/github/release-date/anthochamp/container-acme-dns?style=for-the-badge&display_date=published_at&color=457EC4)

Container images based on [acme.sh](https://github.com/acmesh-official/acme.sh), automating TLS certificate issuance and renewal using the DNS-01 challenge.

## How to use this image

The container issues a certificate on first start, then renews it automatically via an internal cron job.

The certificate, full-chain, and private key are written to the paths defined by `ACME_DNS_CERT_FILE`, `ACME_DNS_CERT_FULLCHAIN_FILE`, and `ACME_DNS_CERT_KEY_FILE` (all inside the `/cert` directory by default). Mount a host directory or a named volume there to retrieve them.

```yaml
services:
  acme-dns:
    image: ghcr.io/anthochamp/container-acme-dns:latest
    restart: unless-stopped
    volumes:
      - acme-state:/var/lib/acme
      - ./certs:/cert
    environment:
      ACME_DNS_ACME_SERVER: letsencrypt
      ACME_DNS_ACME_ACCOUNT: admin@example.com
      ACME_DNS_PROVIDER: dns_cf          # any acme.sh DNS provider
      ACME_DNS_PROVIDER_ENV_PREFIX: CF_  # load CF_* vars through __FILE support
      ACME_DNS_CERT_DOMAINS: example.com *.example.com
      CF_Token__FILE: /run/secrets/cf_token
    secrets:
      - cf_token

volumes:
  acme-state:

secrets:
  cf_token:
    file: ./secrets/cf_token.txt
```

## Volumes

- `/var/lib/acme/` — acme.sh state directory (account key, certificate metadata).
- `/cert/` — Output directory for issued certificates (see `ACME_DNS_CERT_FILE`, `ACME_DNS_CERT_FULLCHAIN_FILE`, `ACME_DNS_CERT_KEY_FILE`).

## Configuration

Sensitive values may be loaded from files by appending `__FILE` to any supported environment variable name, including DNS provider credentials (e.g., `CF_Token__FILE=/run/secrets/cf_token`).

### ACME_DNS_ACME_SERVER

**Default**: `letsencrypt`

ACME server to use. Refer to the [acme.sh server documentation](https://github.com/acmesh-official/acme.sh/wiki/Server) for possible values.

### ACME_DNS_ACME_ACCOUNT

**Default**: *empty* (optional)

ACME account email address.

### ACME_DNS_PROVIDER

**Default**: *empty*

DNS provider name passed to acme.sh. Refer to the [acme.sh DNS API documentation](https://github.com/acmesh-official/acme.sh/wiki/dnsapi) for possible values.

### ACME_DNS_PROVIDER_ENV_PREFIX

**Default**: *empty*

Prefix of additional environment variables to pass to acme.sh. Variables matching this prefix are exposed to acme.sh and support the `__FILE` suffix for Docker secrets. Useful for DNS provider credentials (e.g., set to `CF_` to expose all `CF_*` variables to acme.sh).

### ACME_DNS_CERT_KEY_LENGTH

**Default**: `2048`

Certificate key type and length.

| Value    | Algorithm     |
|----------|---------------|
| `ec-256` | prime256v1    |
| `ec-384` | secp384r1     |
| `ec-521` | secp521r1     |
| `2048`   | RSA 2048      |
| `3072`   | RSA 3072      |
| `4096`   | RSA 4096      |

### ACME_DNS_CERT_DOMAINS

**Default**: *empty*

Space-separated list of domains (common name and SANs) for the certificate request.

Example: `ACME_DNS_CERT_DOMAINS="foo.com *.foo.com bar.net *.bar.net"` produces a certificate with CN `foo.com` and SANs `*.foo.com`, `bar.net`, `*.bar.net`.

### ACME_DNS_CERT_FILE

**Default**: `/cert/cert.pem`

Output path for the issued certificate (leaf only).

### ACME_DNS_CERT_FULLCHAIN_FILE

**Default**: `/cert/fullchain.pem`

Output path for the full certificate chain (including intermediates).

### ACME_DNS_CERT_KEY_FILE

**Default**: `/cert/key.pem`

Output path for the certificate private key.

### ACME_DNS_INSECURE

**Default**: `0`

Set to `1` to pass `--insecure` to acme.sh, disabling TLS certificate verification when communicating with the ACME server. Useful when testing against a local CA (e.g., Pebble).

### ACME_DNS_DNSSLEEP

**Default**: *empty* (acme.sh default)

Override the DNS propagation wait time in seconds (`--dnssleep`). Leave unset to use acme.sh's built-in DNS check loop.

### ACME_DNS_PREFERRED_CHAIN

**Default**: *empty* (optional)

Select an alternative certificate chain by specifying the issuer CN (`--preferred-chain`). Example: `ISRG Root X1`.

Refer to the [acme.sh preferred chain documentation](https://github.com/acmesh-official/acme.sh/wiki/Preferred-Chain) for details.

### ACME_DNS_CHALLENGE_ALIAS

**Default**: *empty* (optional)

Delegate DNS-01 challenge records to a different domain (`--challenge-alias`). Useful when the domain's DNS provider has no API support but a second zone does.

Refer to the [acme.sh DNS alias mode documentation](https://github.com/acmesh-official/acme.sh/wiki/DNS-alias-mode) for details.

### ACME_DNS_CRON_SCHEDULE

**Default**: `26 12 * * *`

Cron expression controlling when the renewal check runs (`acme.sh --cron`). The default fires once a day at 12:26 UTC, matching the acme.sh upstream default.

## References

- [acme.sh on GitHub](https://github.com/acmesh-official/acme.sh)
- [acme.sh DNS API documentation](https://github.com/acmesh-official/acme.sh/wiki/dnsapi)
- [acme.sh server list](https://github.com/acmesh-official/acme.sh/wiki/Server)
