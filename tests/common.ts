import { randomBytes } from "node:crypto";
import * as path from "node:path";

import {
	dockerContainerRm,
	dockerContainerRun,
	dockerNetworkCreate,
	dockerNetworkRm,
} from "@ac-kit/cmd-docker";
import { sleep } from "@ac-kit/core";
import { initDockerSuite } from "@ac-kit/integration-test-util";
import { afterAll, beforeAll } from "vitest";

const srcPath = path.resolve(path.join(__dirname, "..", "src"));
const fixturesPath = path.resolve(path.join(__dirname, "fixtures"));

export function initSuite() {
	const suffix = randomBytes(8).toString("hex");
	const networkName = `test-acme-dns-${suffix}-net`;
	const pebbleName = `test-acme-dns-${suffix}-pebble`;
	const challName = `test-acme-dns-${suffix}-chall`;

	const { containerImageName: imageName } = initDockerSuite(srcPath, {
		containerNamePrefix: "test-acme-dns-",
	});

	beforeAll(async () => {
		await dockerNetworkCreate(networkName);

		// challtestsrv: DNS resolver + HTTP management API for ACME challenge records
		await dockerContainerRun("ghcr.io/letsencrypt/pebble-challtestsrv", {
			detach: true,
			name: challName,
			network: networkName,
		});

		// pebble: lightweight ACME server using challtestsrv as its DNS resolver
		await dockerContainerRun("ghcr.io/letsencrypt/pebble", {
			detach: true,
			name: pebbleName,
			network: networkName,
			command: "-dnsserver",
			commandArgs: [`${challName}:8053`],
			env: { PEBBLE_VA_NOSLEEP: "1" },
		});

		// Give pebble a moment to start
		await sleep(2000);
	});

	afterAll(async () => {
		// Every step runs even when an earlier one throws, or a container that
		// refuses to die would strand the network for the rest of the suite.
		const failures: unknown[] = [];

		for (const step of [
			() => dockerContainerRm([pebbleName], { force: true }),
			() => dockerContainerRm([challName], { force: true }),
			() => dockerNetworkRm([networkName]),
		]) {
			try {
				await step();
			} catch (error) {
				failures.push(error);
			}
		}

		if (failures.length === 1) {
			throw failures[0];
		}
		if (failures.length > 1) {
			throw new AggregateError(failures, "acme-dns suite cleanup failed");
		}
	});

	return {
		imageName,
		networkName,
		challName,
		pebbleAcmeDir: `https://${pebbleName}:14000/dir`,
		fixturesPath,
	};
}
