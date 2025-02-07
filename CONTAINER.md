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
