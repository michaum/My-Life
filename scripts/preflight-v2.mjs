import { execFileSync } from "node:child_process";

const EXPECTED_BRANCH = "v2-redesign";

function git(...args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function stop(message) {
  console.error("");
  console.error("========================================");
  console.error("🔴 MY LIFE V2 — DEVELOPMENT BLOCKED");
  console.error("========================================");
  console.error(message);
  console.error("");
  process.exit(1);
}

console.log("========================================");
console.log("   MY LIFE V2 — DEVELOPMENT PREFLIGHT");
console.log("========================================");

let branch;

try {
  branch = git("branch", "--show-current");
} catch {
  stop("This folder is not a usable Git repository.");
}

if (branch !== EXPECTED_BRANCH) {
  stop(`Current branch is '${branch}'. Expected '${EXPECTED_BRANCH}'.`);
}

const changes = git("status", "--porcelain");

if (changes) {
  console.error(changes);
  stop("Uncommitted changes exist. Nothing was fetched or overwritten.");
}

console.log("✓ Working tree is clean.");
console.log("✓ Correct branch: v2-redesign");
console.log("Checking GitHub...");

try {
  execFileSync("git", ["fetch", "origin"], { stdio: "inherit" });
} catch {
  stop("Could not fetch GitHub. Development was not started.");
}

const local = git("rev-parse", "HEAD");
const remote = git("rev-parse", `origin/${EXPECTED_BRANCH}`);
const base = git("merge-base", "HEAD", `origin/${EXPECTED_BRANCH}`);

if (local === remote) {
  console.log("");
  console.log("========================================");
  console.log("🟢 SAFE TO DEVELOP");
  console.log("This computer exactly matches GitHub.");
  console.log(`Commit: ${local.slice(0, 7)}`);
  console.log("========================================");
  process.exit(0);
}

if (local === base) {
  console.log("GitHub is newer. Fast-forwarding safely...");

  try {
    execFileSync(
      "git",
      ["merge", "--ff-only", `origin/${EXPECTED_BRANCH}`],
      { stdio: "inherit" },
    );
  } catch {
    stop("Safe fast-forward failed. Nothing else will be started.");
  }

  const updated = git("rev-parse", "HEAD");

  if (updated !== remote) {
    stop("Update completed but local and GitHub still do not match.");
  }

  console.log("");
  console.log("========================================");
  console.log("🟢 SAFE TO DEVELOP");
  console.log("GitHub was newer and this computer was safely updated.");
  console.log(`Commit: ${updated.slice(0, 7)}`);
  console.log("========================================");
  process.exit(0);
}

if (remote === base) {
  stop(
    "This computer has commits that are not on GitHub. Push them before starting a new coding session.",
  );
}

stop(
  "This computer and GitHub have diverged. Manual reconciliation is required; nothing was overwritten.",
);
