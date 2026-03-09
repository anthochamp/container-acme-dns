import * as assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import { sleep } from "@ac-essentials/misc-util";
import { initSuite } from "./common.js";

const CERT_ISSUE_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 2_000;
const TEST_DOMAIN = "test.acme.example";
const CERT_FILES = ["/cert/cert.pem", "/cert/fullchain.pem", "/cert/key.pem"];

describe("certificate issuance", () => {
	const {
		imageName,
		networkName,
		challName,
		pebbleAcmeDir,
		fixturesPath,
		docker,
	} = initSuite();

	const containers: string[] = [];

	afterEach(async () => {
		for (const name of containers.splice(0)) {
			try {
				await docker(`container rm -f ${name}`);
			} catch (_) {}
		}
	});

	it("issues a certificate and writes files with correct permissions", {
		timeout: CERT_ISSUE_TIMEOUT_MS + 30_000,
	}, async () => {
		const containerName = `test-acme-dns-run-${randomBytes(6).toString("hex")}`;
		containers.push(containerName);

		const hookSrc = `${fixturesPath}/dns_challtestsrv.sh`;
		const hookDst = "/opt/acme.sh/dnsapi/dns_challtestsrv.sh";

		await docker(
			`run -d --name ${containerName}` +
				` --network ${networkName}` +
				` -v ${hookSrc}:${hookDst}:ro` +
				` -e ACME_DNS_ACME_SERVER=${pebbleAcmeDir}` +
				` -e ACME_DNS_PROVIDER=dns_challtestsrv` +
				` -e ACME_DNS_CERT_DOMAINS=${TEST_DOMAIN}` +
				` -e CHALLTESTSRV_URL=http://${challName}:8055` +
				` -e ACME_DNS_INSECURE=1` +
				` -e ACME_DNS_DNSSLEEP=0` +
				` ${imageName}`,
		);

		// Poll until all cert files appear inside the container, or timeout
		const deadline = Date.now() + CERT_ISSUE_TIMEOUT_MS;
		let allExist = false;
		while (Date.now() < deadline) {
			try {
				for (const f of CERT_FILES) {
					await docker(`exec ${containerName} test -f ${f}`);
				}
				allExist = true;
				break;
			} catch (_) {
				await sleep(POLL_INTERVAL_MS);
			}
		}

		assert.ok(
			allExist,
			`cert files should exist within ${CERT_ISSUE_TIMEOUT_MS}ms`,
		);

		// Check permissions and ownership using stat inside the container
		// stat -c '%a %u' returns "mode uid", e.g. "644 1000"
		const statFile = async (file: string) => {
			const { stdout } = (await docker(
				`exec ${containerName} stat -c %a_%u ${file}`,
			)) as unknown as { stdout: string };
			const parts = stdout.trim().split("_");
			return {
				mode: Number.parseInt(parts[0] ?? "0", 8),
				uid: Number.parseInt(parts[1] ?? "-1", 10),
			};
		};

		const certStat = await statFile("/cert/cert.pem");
		const keyStat = await statFile("/cert/key.pem");
		const fullchainStat = await statFile("/cert/fullchain.pem");

		assert.equal(
			certStat.mode,
			0o644,
			`cert.pem mode should be 644, got ${certStat.mode.toString(8)}`,
		);
		assert.equal(
			keyStat.mode,
			0o600,
			`key.pem mode should be 600, got ${keyStat.mode.toString(8)}`,
		);
		assert.equal(
			fullchainStat.mode,
			0o644,
			`fullchain.pem mode should be 644, got ${fullchainStat.mode.toString(8)}`,
		);

		assert.equal(
			certStat.uid,
			1000,
			`cert.pem should be owned by uid 1000 (acme user), got ${certStat.uid}`,
		);
	});
});
