#!/usr/bin/env sh
set -eu

# shellcheck disable=SC2120,SC3043
replaceEnvSecrets() {
	# replaceEnvSecrets 1.0.0
	# https://gist.github.com/anthochamp/d4d9537f52e5b6c42f0866dd823a605f
	local prefix="${1:-}"

	for envSecretName in $(export | awk '{print $2}' | grep -oE '^[^=]+' | grep '__FILE$'); do
		if [ -z "$prefix" ] || printf '%s' "$envSecretName" | grep "^$prefix" >/dev/null; then
			local envName
			envName=$(printf '%s' "$envSecretName" | sed 's/__FILE$//')

			local filePath
			filePath=$(eval echo '${'"$envSecretName"':-}')

			if [ -n "$filePath" ]; then
				if [ -f "$filePath" ]; then
					echo Using content from "$filePath" file for "$envName" environment variable value.

					export "$envName"="$(cat -A "$filePath")"
					unset "$envSecretName"
				else
					echo ERROR: Environment variable "$envSecretName" is defined but does not point to a regular file. 1>&2
					exit 1
				fi
			fi
		fi
	done
}

replaceEnvSecrets ACME_DNS_

export ACME_DNS_ACME_SERVER="${ACME_DNS_ACME_SERVER:-letsencrypt}"
export ACME_DNS_ACME_ACCOUNT="${ACME_DNS_ACME_ACCOUNT:-}"
export ACME_DNS_PROVIDER="${ACME_DNS_PROVIDER:-}"
export ACME_DNS_PROVIDER_ENV_PREFIX="${ACME_DNS_PROVIDER_ENV_PREFIX:-}"
export ACME_DNS_CERT_KEY_LENGTH="${ACME_DNS_CERT_KEY_LENGTH:-2048}"
export ACME_DNS_CERT_DOMAINS="${ACME_DNS_CERT_DOMAINS:-}"
export ACME_DNS_CERT_FILE="${ACME_DNS_CERT_FILE:-/cert/cert.pem}"
export ACME_DNS_CERT_FULLCHAIN_FILE="${ACME_DNS_CERT_FULLCHAIN_FILE:-/cert/fullchain.pem}"
export ACME_DNS_CERT_KEY_FILE="${ACME_DNS_CERT_KEY_FILE:-/cert/key.pem}"
export ACME_DNS_INSECURE="${ACME_DNS_INSECURE:-0}"
export ACME_DNS_DNSSLEEP="${ACME_DNS_DNSSLEEP:-}"
export ACME_DNS_PREFERRED_CHAIN="${ACME_DNS_PREFERRED_CHAIN:-}"
export ACME_DNS_CHALLENGE_ALIAS="${ACME_DNS_CHALLENGE_ALIAS:-}"
export ACME_DNS_CRON_SCHEDULE="${ACME_DNS_CRON_SCHEDULE:-26 12 * * *}"

if [ -n "$ACME_DNS_PROVIDER_ENV_PREFIX" ]; then
	replaceEnvSecrets "$ACME_DNS_PROVIDER_ENV_PREFIX"
fi

if [ "$1" != "supercronic" ]; then
	exec "$@"
fi

if [ -z "$ACME_DNS_PROVIDER" ]; then
	echo missing ACME_DNS_PROVIDER >&2
	exit 1
fi

if [ -z "$ACME_DNS_CERT_DOMAINS" ]; then
	echo missing ACME_DNS_CERT_DOMAINS >&2
	exit 1
fi

chown -hR acme:acme /var/lib/acme

main=''
for domain in $ACME_DNS_CERT_DOMAINS; do
	[ -z "$main" ] && main=$domain
done

acme_insecure_flag=''
[ "$ACME_DNS_INSECURE" = '1' ] && acme_insecure_flag='--insecure'

# Use a function with set -- so values with spaces (e.g. PREFERRED_CHAIN="ISRG Root X1")
# are passed as properly quoted words rather than being word-split.
acme_issue() {
	set -- \
		--dns "$ACME_DNS_PROVIDER" \
		--keylength "$ACME_DNS_CERT_KEY_LENGTH"
	[ "$ACME_DNS_INSECURE" = '1' ] && set -- "$@" --insecure
	[ -n "$ACME_DNS_DNSSLEEP" ] && set -- "$@" --dnssleep "$ACME_DNS_DNSSLEEP"
	[ -n "$ACME_DNS_PREFERRED_CHAIN" ] && set -- "$@" --preferred-chain "$ACME_DNS_PREFERRED_CHAIN"
	[ -n "$ACME_DNS_CHALLENGE_ALIAS" ] && set -- "$@" --challenge-alias "$ACME_DNS_CHALLENGE_ALIAS"
	for domain in $ACME_DNS_CERT_DOMAINS; do
		set -- "$@" -d "$domain"
	done
	su-exec acme:acme acme.sh --issue "$@"
}

# shellcheck disable=SC2086
su-exec acme:acme acme.sh --set-default-ca --server "$ACME_DNS_ACME_SERVER" $acme_insecure_flag

if [ -n "$ACME_DNS_ACME_ACCOUNT" ]; then
	su-exec acme:acme acme.sh --register-account -m "$ACME_DNS_ACME_ACCOUNT" $acme_insecure_flag
fi

set +e
acme_issue
errcode=$?
# errcode 2 is when the cert is already issued
[ $errcode != 0 ] && [ $errcode != 2 ] && exit 1
set -e

mkdir -p "$(dirname "$ACME_DNS_CERT_FILE")"
mkdir -p "$(dirname "$ACME_DNS_CERT_FULLCHAIN_FILE")"
mkdir -p "$(dirname "$ACME_DNS_CERT_KEY_FILE")"
chown -R acme:acme \
	"$(dirname "$ACME_DNS_CERT_FILE")" \
	"$(dirname "$ACME_DNS_CERT_FULLCHAIN_FILE")" \
	"$(dirname "$ACME_DNS_CERT_KEY_FILE")"

su-exec acme:acme acme.sh --install-cert -d "$main" \
	--cert-file "$ACME_DNS_CERT_FILE" \
	--fullchain-file "$ACME_DNS_CERT_FULLCHAIN_FILE" \
	--key-file "$ACME_DNS_CERT_KEY_FILE"

j2Templates="
/etc/supercronic/crontab
"

for file in $j2Templates; do
	export | jinja2 --format env -o "$file" "$file.j2"

	# can't use --reference with alpine
	chmod "$(stat -c '%a' "$file.j2")" "$file"
	chown "$(stat -c '%U:%G' "$file.j2")" "$file"
done

exec su-exec acme:acme "$@"
