import { randomBytes } from "node:crypto";

import { dockerContainerExec, dockerContainerRm, dockerContainerRun } from "@ac-kit/cmd-docker";
import { sleep } from "@ac-kit/core";
import { afterEach, expect, describe, it } from "vitest";

import { initSuite } from "./common";

const CERT_ISSUE_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 2_000;
const TEST_DOMAIN = "test.acme.example";
const CERT_FILES = ["/cert/cert.pem", "/cert/fullchain.pem", "/cert/key.pem"];

describe("certificate issuance", () => {
	const { imageName, networkName, challName, pebbleAcmeDir, fixturesPath } = initSuite();

	const containers: string[] = [];

	afterEach(async () => {
		for (const name of containers.splice(0)) {
			await dockerContainerRm([name], { force: true });
		}
	});

	it("issues a certificate and writes files with correct permissions", async () => {
		const containerName = `test-acme-dns-run-${randomBytes(6).toString("hex")}`;
		const hookSrc = `${fixturesPath}/dns_challtestsrv.sh`;
		const hookDst = "/opt/acme.sh/dnsapi/dns_challtestsrv.sh";

		await dockerContainerRun(imageName, {
			detach: true,
			name: containerName,
			network: networkName,
			volume: [`${hookSrc}:${hookDst}:ro`],
			env: {
				ACME_DNS_ACME_SERVER: pebbleAcmeDir,
				ACME_DNS_PROVIDER: "dns_challtestsrv",
				ACME_DNS_CERT_DOMAINS: TEST_DOMAIN,
				CHALLTESTSRV_URL: `http://${challName}:8055`,
				ACME_DNS_INSECURE: "1",
				ACME_DNS_DNSSLEEP: "0",
			},
		});
		containers.push(containerName);

		// Poll until all cert files appear inside the container, or timeout
		const deadline = Date.now() + CERT_ISSUE_TIMEOUT_MS;
		let allExist = false;
		while (Date.now() < deadline) {
			try {
				for (const f of CERT_FILES) {
					await dockerContainerExec(containerName, "test", {
						commandArgs: ["-f", f],
					});
				}
				allExist = true;
				break;
			} catch {
				await sleep(POLL_INTERVAL_MS);
			}
		}

		expect(allExist, `cert files should exist within ${CERT_ISSUE_TIMEOUT_MS}ms`).toBe(true);

		// Check permissions and ownership using stat inside the container
		// stat -c '%a %u' returns "mode uid", e.g. "644 1000"
		const statFile = async (file: string) => {
			const { stdout } = await dockerContainerExec(containerName, "stat", {
				commandArgs: ["-c", "%a_%u", file],
			});
			const parts = stdout.trim().split("_");
			return {
				mode: Number.parseInt(parts[0] ?? "0", 8),
				uid: Number.parseInt(parts[1] ?? "-1", 10),
			};
		};

		const certStat = await statFile("/cert/cert.pem");
		const keyStat = await statFile("/cert/key.pem");
		const fullchainStat = await statFile("/cert/fullchain.pem");

		expect(certStat.mode, `cert.pem mode should be 644, got ${certStat.mode.toString(8)}`).toBe(
			0o644,
		);
		expect(keyStat.mode, `key.pem mode should be 600, got ${keyStat.mode.toString(8)}`).toBe(0o600);
		expect(
			fullchainStat.mode,
			`fullchain.pem mode should be 644, got ${fullchainStat.mode.toString(8)}`,
		).toBe(0o644);

		expect(
			certStat.uid,
			`cert.pem should be owned by uid 1000 (acme user), got ${certStat.uid}`,
		).toBe(1000);
	});
});
