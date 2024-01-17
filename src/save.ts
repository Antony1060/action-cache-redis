import * as core from "@actions/core"
import * as glob from "@actions/glob"
import * as exec from "@actions/exec"
import {createHash} from "node:crypto"
import {readFile} from "node:fs/promises"
import { createClient} from "redis";

const hashSha256 = (input: Buffer): Buffer => {
    return createHash("sha256").update(input).digest();
}

try {
    (async () => {
        const paths = core.getInput("paths");
        const key = core.getInput("key");
        const redisUrl = core.getInput("redis-url");

        const redisClient = await createClient({ url: redisUrl }).connect();

        const globber = await glob.create(paths);
        const files = await globber.glob();

        const repoName = process.env.GITHUB_REPOSITORY ?? "";
        core.info(`Running on ${repoName}`);
        const repoHashed = hashSha256(Buffer.from(repoName, "utf8"));

        const cacheKey = `${repoHashed.toString("hex")}-${key}`
        core.info(cacheKey);

        const tarFilePath = `/tmp/${cacheKey}.tar.gz`

        await exec.exec("tar", ["-czf", tarFilePath, ...files]);
        await exec.exec("ls", ["-lh", tarFilePath]);

        const tarContent = await readFile(tarFilePath);

        await redisClient.set(cacheKey, tarContent);
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
