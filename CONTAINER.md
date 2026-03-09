# Certificates issuer and periodical renewer container images

Container images based on the official [acme.sh](https://github.com/acmesh-official/acme.sh) script, wrapping certificates initial issuance and periodical renewal in DNS mode.

Sources are available on [GitHub](https://github.com/anthochamp/container-acme-dns).

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [Image tags](#image-tags)
- [How to use this image](#how-to-use-this-image)
- [Volumes](#volumes)
- [Configuration](#configuration)
  - [ACME_DNS_ACME_SERVER](#acme_dns_acme_server)
  - [ACME_DNS_ACME_ACCOUNT](#acme_dns_acme_account)
  - [ACME_DNS_PROVIDER](#acme_dns_provider)
  - [ACME_DNS_PROVIDER_ENV_PREFIX](#acme_dns_provider_env_prefix)
  - [ACME_DNS_CERT_KEY_LENGTH](#acme_dns_cert_key_length)
  - [ACME_DNS_CERT_DOMAINS](#acme_dns_cert_domains)
  - [ACME_DNS_CERT_FILE](#acme_dns_cert_file)
  - [ACME_DNS_CERT_FULLCHAIN_FILE](#acme_dns_cert_fullchain_file)
  - [ACME_DNS_CERT_KEY_FILE](#acme_dns_cert_key_file)
  - [ACME_DNS_INSECURE](#acme_dns_insecure)
  - [ACME_DNS_DNSSLEEP](#acme_dns_dnssleep)
  - [ACME_DNS_PREFERRED_CHAIN](#acme_dns_preferred_chain)
  - [ACME_DNS_CHALLENGE_ALIAS](#acme_dns_challenge_alias)
  - [ACME_DNS_CRON_SCHEDULE](#acme_dns_cron_schedule)

<!-- /TOC -->

## Image tags

- `x.y.z-acmeshA.B.C` tags the `x.y.z` container image version, embedded with
the acme.sh `A.B.C` version.
- `edge-acmeshA.B.C` tags the container image built from the last repository
commit, embedded with the acme.sh `A.B.C` version.

Tags aliases :

- `x.y-acmeshA.B.C` aliases the latest patch version of the container image `x.y`
major+minor version, embedded with the acme.sh `A.B.C` version;
- `x-acmeshA.B.C` aliases the latest minor+patch version of the container image
`x` major version, embedded with the acme.sh `A.B.C` version;
- `x.y.z` aliases the `x.y.z` container image version embedded with the latest
acme.sh version (Note: only the latest container image version gets updated);
- `x.y` aliases the latest patch version of the container image `x.y` major+minor
version, embedded with the latest acme.sh release (Note: only the latest container
image major+minor version gets updated);
- `x` aliases the latest minor+patch version of the container image `x` major
version, embedded with the latest acme.sh version (Note: only the latest container
image major version gets updated);
- `acmeshA.B` aliases the latest container image version, embedded with the latest
patch version of the acme.sh `A.B` major+minor version;
- `acmeshA` aliases the latest container image version, embedded with the latest
minor+patch version of the acme.sh `A` major version;
- `latest` aliases the latest `x.y.z-acmeshA.B.C` tag;
- `edge-acmeshA.B` aliases the container image built from the last repository
commit, embedded with the latest patch version of the acme.sh `A.B` major+minor
version;
- `edge-acmeshA` aliases the container image built from the last repository
commit, embedded with the latest minor+patch version of the acme.sh `A` major
version.
- `edge` aliases the latest `edge-acmeshA.B.C` tag;

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

- `/var/lib/acme/` stores acme.sh state (eg. account key)

## Configuration

As an alternative to passing sensitive information via environment variables, `__FILE` may be appended to any of the listed environment variables below, causing the initialization script to load the values for those variables from files present in the container.

In particular, this can be used to load values from Docker secrets stored in `/run/secrets/<secret_name>` files. For example : `ACME_DNS_ACME_ACCOUNT__FILE=/run/secrets/acme_account`.

### ACME_DNS_ACME_SERVER

**Default**: `letsencrypt`

Refer to the [acme.sh official documentation](https://github.com/acmesh-official/acme.sh/wiki/Server) for the possible values.

### ACME_DNS_ACME_ACCOUNT

**Default**: *empty* (optional)

### ACME_DNS_PROVIDER

**Default**: *empty*

Refer to [acme.sh official documentation](https://github.com/acmesh-official/acme.sh/wiki/dnsapi) for the possible values.

### ACME_DNS_PROVIDER_ENV_PREFIX

**Default**: *empty*

When you need to pass additional environment variables to acme.sh and want to get support for the `__FILE` feature on those, you can pass the environment variables prefix here. This is especially useful for DNS credentials.

### ACME_DNS_CERT_KEY_LENGTH

**Default**: `2048`

| Value | Algorithm |
| - | - |
| `ec-256` | prime256v1 |
| `ec-384` | secp384r1 |
| `ec-521` | secp521r1 |
| `2048` | RSA 2048 |
| `3072` | RSA 3072 |
| `4096` | RSA 4096 |

### ACME_DNS_CERT_DOMAINS

**Default**: *empty*

List of space-separated domains (common name and SANs).

For example, with `ACME_DNS_CERT_DOMAINS="foo.com *.foo.com bar.net *.bar.net"`, the common name will be `foo.com` with three SANs `*.foo.com`, `bar.net` and `*.bar.net`

###  ACME_DNS_CERT_FILE

**Default**: `/cert/cert.pem`

###  ACME_DNS_CERT_FULLCHAIN_FILE

**Default**: `/cert/fullchain.pem`

###  ACME_DNS_CERT_KEY_FILE

**Default**: `/cert/key.pem`

### ACME_DNS_INSECURE

**Default**: `0`

Set to `1` to pass `--insecure` to acme.sh, disabling TLS certificate verification when communicating with the ACME server. Useful when pointing `ACME_DNS_ACME_SERVER` at a local test CA (e.g. Pebble).

### ACME_DNS_DNSSLEEP

**Default**: *empty* (acme.sh default)

Override the DNS propagation wait time (in seconds) passed to acme.sh via `--dnssleep`. Leave unset to use acme.sh's built-in DNS check loop.

### ACME_DNS_PREFERRED_CHAIN

**Default**: *empty* (optional)

Select an alternative certificate chain by specifying the issuer CN in the chain. Passed to acme.sh as `--preferred-chain`. Example: `ISRG Root X1`.

Refer to [acme.sh documentation](https://github.com/acmesh-official/acme.sh/wiki/Preferred-Chain) for details.

### ACME_DNS_CHALLENGE_ALIAS

**Default**: *empty* (optional)

Delegate DNS-01 challenge records to a different domain. Passed to acme.sh as `--challenge-alias`. Useful when the domain's DNS provider has no API support but a second zone (e.g. `_acme-challenge.acme.example.com`) does.

Refer to [acme.sh DNS alias mode documentation](https://github.com/acmesh-official/acme.sh/wiki/DNS-alias-mode) for details.

### ACME_DNS_CRON_SCHEDULE

**Default**: `26 12 * * *`

Cron expression controlling when `acme.sh --cron` runs to renew certificates. The default fires once a day at 12:26 UTC (matching the acme.sh upstream default). Adjust if you need a different renewal window.
