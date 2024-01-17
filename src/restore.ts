import * as core from "@actions/core"

try {
    core.info("doing restore");
} catch (error) {
    if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string")
        core.setFailed(error.message)
    else if (error instanceof Error)
        core.setFailed(error)
    else
        core.setFailed("Failed")
}
