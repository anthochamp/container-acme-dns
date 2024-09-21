#!/usr/bin/env sh
set -eu

if [ "$1" != "crond" ]; then
	exec "$@"
fi

# shellcheck disable=SC2120,SC3043
replaceEnvSecrets() {
	# replaceEnvSecrets 1.0.0
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

if [ -n "$ACME_DNS_PROVIDER_ENV_PREFIX" ]; then
	replaceEnvSecrets "$ACME_DNS_PROVIDER_ENV_PREFIX"
fi

if [ -z "$ACME_DNS_PROVIDER" ]; then
	echo missing ACME_DNS_PROVIDER >&2
	exit 1
fi

if [ -z "$ACME_DNS_CERT_DOMAINS" ]; then
	echo missing ACME_DNS_CERT_DOMAINS >&2
	exit 1
fi

main=''
args=''
for domain in $ACME_DNS_CERT_DOMAINS; do
	[ -z "$main" ] && main=$domain
	args=$args" -d "$domain
done

/root/.acme.sh/acme.sh --set-default-ca --server "$ACME_DNS_ACME_SERVER"

if [ -n "$ACME_DNS_ACME_ACCOUNT" ]; then
	/root/.acme.sh/acme.sh --register-account -m "$ACME_DNS_ACME_ACCOUNT"
fi

set +e
# shellcheck disable=SC2086
/root/.acme.sh/acme.sh --issue \
	--dns "$ACME_DNS_PROVIDER" \
	--keylength "$ACME_DNS_CERT_KEY_LENGTH" \
	$args
errcode=$?
# errcode 2 is when the cert is already issued
[ $errcode != 0 ] && [ $errcode != 2 ] && exit 1
set -e

mkdir -p "$(dirname "$ACME_DNS_CERT_FILE")"
mkdir -p "$(dirname "$ACME_DNS_CERT_FULLCHAIN_FILE")"
mkdir -p "$(dirname "$ACME_DNS_CERT_KEY_FILE")"

/root/.acme.sh/acme.sh --install-cert -d "$main" \
	--cert-file "$ACME_DNS_CERT_FILE" \
	--fullchain-file "$ACME_DNS_CERT_FULLCHAIN_FILE" \
	--key-file "$ACME_DNS_CERT_KEY_FILE"

exec "$@"
