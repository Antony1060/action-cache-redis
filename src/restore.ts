import * as core from "@actions/core"
import { createClient, commandOptions } from "redis";
import * as exec from "@actions/exec";
import { writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const hashSha256 = (input: Buffer): Buffer => {
    return createHash("sha256").update(input).digest();
}

try {
    (async () => {
        const key = core.getInput("key");
        const redisUrl = core.getInput("redis-url");

        const redisClient = await createClient({ url: redisUrl }).connect();

        const repoName = process.env.GITHUB_REPOSITORY ?? "";
        core.info(`Running on ${repoName}`);
        const repoHashed = hashSha256(Buffer.from(repoName, "utf8"));

        const cacheKey = `${repoHashed.toString("hex")}-${key}`
        core.info(cacheKey);

        const tarFilePath = `/tmp/${cacheKey}.tar.gz`

        const tarContent = await redisClient.get(commandOptions({returnBuffers: true}), cacheKey);

        if (!tarContent) {
            core.info("Cache miss");
            core.setOutput("cache-hit", false);
            process.exit(0);
        }

        await writeFile(tarFilePath, tarContent);

        await exec.exec("tar", ["-xzvf", tarFilePath, "-C", "/"]);

        core.info("Cache hit and restored");
        core.setOutput("cache-hit", true);
        process.exit(0);
    })()
} catch (error) {
    if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string")
        core.setFailed(error.message)
    else if (error instanceof Error)
        core.setFailed(error)
    else
        core.setFailed("Failed")
}
