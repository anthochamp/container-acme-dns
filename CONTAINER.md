# Certificates issuer and periodical renewer container images

Container images based on the official [acme.sh](https://github.com/acmesh-official/acme.sh) script, wrapping certificates initial issuance and periodical renewal in DNS mode.

Sources are available on [GitHub](https://github.com/anthochamp/container-acme-dns).

## Image tags

- `x.y.z`, `x.y` and `x` tags releases on multiple semver levels
- `latest` tags the latest release
- `edge` tags the image build automatically on the latest Git commit

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
