import { randomBytes } from "node:crypto";
import * as path from "node:path";
import {
	dockerBuildxBuild,
	dockerContextShow,
	dockerContextUse,
	dockerImageRm,
} from "@ac-essentials/cli";
import { execAsync, sleep } from "@ac-essentials/misc-util";
import { afterAll, beforeAll } from "vitest";

const srcPath = path.resolve(path.join(__dirname, "..", "src"));
const fixturesPath = path.resolve(path.join(__dirname, "fixtures"));

export function initSuite() {
	let initialContext: string;

	const suffix = randomBytes(8).toString("hex");
	const imageName = `test-acme-dns-img-${suffix}`;
	const networkName = `test-acme-dns-net-${suffix}`;
	const pebbleName = `test-acme-dns-pebble-${suffix}`;
	const challName = `test-acme-dns-chall-${suffix}`;

	const docker = (cmd: string) =>
		execAsync(`docker --context default ${cmd}`, { encoding: "utf-8" });

	beforeAll(async () => {
		initialContext = await dockerContextShow();
		await dockerContextUse("default");

		try {
			await dockerImageRm([imageName], { force: true });
		} catch (_) {}

		await dockerBuildxBuild(srcPath, { tags: [imageName] });

		await docker(`network create ${networkName}`);

		// challtestsrv: DNS resolver + HTTP management API for ACME challenge records
		await docker(
			`run -d --name ${challName} --network ${networkName} ghcr.io/letsencrypt/pebble-challtestsrv`,
		);

		// pebble: lightweight ACME server using challtestsrv as its DNS resolver
		await docker(
			`run -d --name ${pebbleName} --network ${networkName}` +
				` -e PEBBLE_VA_NOSLEEP=1` +
				` ghcr.io/letsencrypt/pebble` +
				` -dnsserver ${challName}:8053`,
		);

		// Give pebble a moment to start
		await sleep(2000);
	});

	afterAll(async () => {
		try {
			await docker(`container rm -f ${pebbleName}`);
		} catch (_) {}
		try {
			await docker(`container rm -f ${challName}`);
		} catch (_) {}
		try {
			await docker(`network rm ${networkName}`);
		} catch (_) {}
		try {
			await dockerImageRm([imageName], { force: true });
		} catch (_) {}
		try {
			await dockerContextUse(initialContext);
		} catch (_) {}
	});

	return {
		imageName,
		networkName,
		challName,
		pebbleAcmeDir: `https://${pebbleName}:14000/dir`,
		fixturesPath,
		docker,
	};
}
