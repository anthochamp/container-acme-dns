FROM alpine:3.20.3@sha256:beefdbd8a1da6d2915566fde36db9db0b524eb737fc57cd1367effd16dc0d06d

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
	cronie

ENV CERT_HOME=/var/lib/acme
ENV CA_HOME=/var/lib/acme/ca

SHELL ["/bin/ash", "-eo", "pipefail", "-c"]

RUN set -ex && \
	wget -q -O - https://get.acme.sh | sh && \
	ln -s /root/.acme.sh/acme.sh /usr/local/bin/acme.sh

RUN acme.sh

RUN crontab -l | grep acme.sh | sed 's#> /dev/null#> /proc/1/fd/1 2>/proc/1/fd/2#' | crontab -

VOLUME ["/var/lib/acme/"]

COPY --chmod=755 /rootfs/usr/local/bin/docker-entrypoint.sh /usr/local/bin

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

CMD [ "crond", "-f" ]

HEALTHCHECK \
	CMD (ps -o comm | grep crond) || exit 1
