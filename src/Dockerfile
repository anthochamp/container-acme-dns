FROM alpine:3.23.3@sha256:25109184c71bdad752c8312a8623239686a9a2071e8825f20acb8f2198c3f659

# Dependencies list based on https://github.com/acmesh-official/acme.sh/blob/master/Dockerfile
# hadolint ignore=DL3018
RUN apk add --update --no-cache \
	openssl \
	openssh-client \
	coreutils \
	bind-tools \
	curl \
	sed \
	socat \
	tzdata \
	oath-toolkit-oathtool \
	tar \
	libidn \
	jq \
	su-exec \
	supercronic \
	jinja2-cli

ENV CERT_HOME=/var/lib/acme
ENV CA_HOME=/var/lib/acme/ca
ENV LE_WORKING_DIR=/opt/acme.sh

SHELL ["/bin/ash", "-eo", "pipefail", "-c"]

# renovate: datasource=github-releases depName=acmesh-official/acme.sh
ARG ACME_SH_VERSION=3.1.2

# hadolint ignore=DL3003
RUN set -ex; \
	wget -q "https://github.com/acmesh-official/acme.sh/archive/refs/tags/${ACME_SH_VERSION}.tar.gz" -O /tmp/acme.tar.gz; \
	tar xzf /tmp/acme.tar.gz -C /tmp; \
	cd /tmp/acme.sh-${ACME_SH_VERSION}; \
	./acme.sh --install --home /opt/acme.sh --no-profile --no-cron; \
	cd -; \
	rm -rf /tmp/acme.tar.gz /tmp/acme.sh-${ACME_SH_VERSION}; \
	ln -s /opt/acme.sh/acme.sh /usr/local/bin/acme.sh

RUN set -ex; \
	addgroup -g 1000 -S acme; \
	adduser -u 1000 -S -D -H -G acme acme; \
	chown -R acme:acme /opt/acme.sh; \
	mkdir -p /etc/supercronic

COPY --chmod=644 --chown=acme:acme /rootfs/etc/supercronic/crontab.j2 /etc/supercronic/

VOLUME ["/var/lib/acme/"]

COPY --chmod=755 /rootfs/usr/local/bin/docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

CMD [ "supercronic", "/etc/supercronic/crontab" ]

HEALTHCHECK \
	CMD (ps -o comm | grep supercronic) || exit 1
