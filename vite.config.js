import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
function readGitValue(command, fallback) {
    try {
        const value = execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
        return value.length > 0 ? value : fallback;
    }
    catch {
        return fallback;
    }
}
function formatBuildTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}/${month}/${day} ${hours}:${minutes}`;
}
const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
export default defineConfig(({ command }) => {
    const buildAt = new Date();
    const commit = readGitValue("git rev-parse --short HEAD", "unknown");
    const lastUpdate = readGitValue("git log -1 --date=short --format=%cd", buildAt.toISOString().slice(0, 10));
    const environment = command === "build" ? "生产环境" : "开发环境";
    return {
        base: "./",
        plugins: [react()],
        define: {
            __APP_VERSION__: JSON.stringify(packageJson.version ?? "0.0.0"),
            __APP_COMMIT__: JSON.stringify(commit),
            __APP_BUILD_TIME__: JSON.stringify(formatBuildTime(buildAt)),
            __APP_LAST_UPDATE__: JSON.stringify(lastUpdate),
            __APP_ENV_LABEL__: JSON.stringify(environment),
        },
    };
});
