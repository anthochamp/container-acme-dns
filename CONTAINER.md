# Acme DNS Container

Container images based on [acme.sh](https://github.com/acmesh-official/acme.sh), automating TLS certificate issuance and renewal using the DNS-01 challenge.

Sources are available on [GitHub](https://github.com/anthochamp/container-acme-dns).

See [README.md](README.md) for full documentation.

## Image tags

- `x.y.z-acmeshA.B.C`: Container image version `x.y.z` with acme.sh `A.B.C`.
- `edge-acmeshA.B.C`: Latest commit build with acme.sh `A.B.C`.

**Tag aliases:**

- `x.y-acmeshA.B.C`: Latest patch of `x.y` (major.minor) with acme.sh `A.B.C`.
- `x-acmeshA.B.C`: Latest minor+patch of `x` (major) with acme.sh `A.B.C`.
- `x.y.z`: Version `x.y.z` with latest acme.sh (only latest container version updated).
- `x.y`: Latest patch of `x.y` (major.minor) with latest acme.sh (only latest container major.minor updated).
- `x`: Latest minor+patch of `x` (major) with latest acme.sh (only latest container major updated).
- `acmeshA.B`: Latest container with latest patch of acme.sh `A.B` (major.minor).
- `acmeshA`: Latest container with latest minor+patch of acme.sh `A` (major).
- `latest`: Latest `x.y.z-acmeshA.B.C` tag.
- `edge-acmeshA.B`: Latest commit build with latest patch of acme.sh `A.B` (major.minor).
- `edge-acmeshA`: Latest commit build with latest minor+patch of acme.sh `A` (major).
- `edge`: Latest `edge-acmeshA.B.C` tag.
