#!/usr/bin/env sh
# acme.sh DNS hook for letsencrypt/pebble challtestsrv (testing only)
# https://github.com/letsencrypt/pebble/tree/main/cmd/challtestsrv

CHALLTESTSRV_URL="${CHALLTESTSRV_URL:-http://challtestsrv:8055}"

dns_challtestsrv_add() {
	fulldomain="$1"
	txtvalue="$2"

	curl -fsS -X POST "${CHALLTESTSRV_URL}/set-txt" \
		-H "Content-Type: application/json" \
		-d "{\"host\": \"${fulldomain}.\", \"value\": \"${txtvalue}\"}"
}

dns_challtestsrv_rm() {
	fulldomain="$1"
	txtvalue="$2"

	curl -fsS -X POST "${CHALLTESTSRV_URL}/clear-txt" \
		-H "Content-Type: application/json" \
		-d "{\"host\": \"${fulldomain}.\"}"
}
