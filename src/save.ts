import * as core from "@actions/core"
import * as glob from "@actions/glob"

try {
    (async () => {
        const paths = core.getInput("paths");

        const globber = await glob.create(paths);
        const files = await globber.glob();

        core.startGroup("files");

        for (const file of files)
            core.info(file);

        core.endGroup();

        core.info("doing save");
    })()
} catch (error) {
    if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string")
        core.setFailed(error.message)
    else if (error instanceof Error)
        core.setFailed(error)
    else
        core.setFailed("Failed")
}
