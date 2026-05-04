"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudexError = void 0;
exports.ask = ask;
exports.askJson = askJson;
exports.askBatch = askBatch;
exports.askStream = askStream;
exports.clearCache = clearCache;
exports.healthCheck = healthCheck;
/**
 * claudex-ts — call Claude from any TS/JS project via Max-sub `claude -p` subprocess.
 * No @anthropic-ai/sdk. No ANTHROPIC_API_KEY. Single file, vendor or import.
 *
 * Public API mirrors the Python claudex:
 *   await ask(prompt) -> { text, cached, promptHash }
 *   await askJson(prompt) -> any
 *   await askBatch({ items, instruction, itemLabel?, extraKeys? }) -> Array<Record<string,string>>
 *   clearCache(projectRoot?) -> number
 *   await healthCheck() -> { ok, claudeBin, sampleResponse?, error? }
 */
const node_child_process_1 = require("node:child_process");
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const DEFAULT_TIMEOUT_MS = 120_000;
const CACHE_DIRNAME = ".claudex_cache";
class ClaudexError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "ClaudexError";
    }
}
exports.ClaudexError = ClaudexError;
function resolveClaudeBin() {
    // Prefer PATH lookup; otherwise fall back to common Windows install spots.
    const candidates = [
        "claude",
        path.join(os.homedir(), ".local", "bin", "claude.exe"),
        path.join(process.env.APPDATA || "", "npm", "claude.cmd"),
        path.join(process.env.APPDATA || "", "npm", "claude"),
    ];
    for (const c of candidates) {
        if (c === "claude")
            return c; // let spawn() find it via PATH
        if ((0, node_fs_1.existsSync)(c))
            return c;
    }
    throw new ClaudexError("Claude CLI not found. Install from https://claude.ai/code.");
}
function hashPrompt(prompt) {
    return (0, node_crypto_1.createHash)("sha256").update(prompt, "utf8").digest("hex").slice(0, 16);
}
function cacheFilePath(projectRoot, prompt) {
    const dir = path.join(projectRoot, CACHE_DIRNAME);
    if (!(0, node_fs_1.existsSync)(dir))
        (0, node_fs_1.mkdirSync)(dir, { recursive: true });
    return path.join(dir, `${hashPrompt(prompt)}.txt`);
}
async function ask(prompt, opts = {}) {
    const projectRoot = opts.projectRoot ?? process.cwd();
    const useCache = opts.useCache ?? true;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const promptHash = hashPrompt(prompt);
    const cf = cacheFilePath(projectRoot, prompt);
    if (useCache && (0, node_fs_1.existsSync)(cf)) {
        return { text: (0, node_fs_1.readFileSync)(cf, "utf8"), cached: true, promptHash };
    }
    const bin = resolveClaudeBin();
    const text = await runClaude(bin, prompt, timeoutMs);
    if (useCache)
        (0, node_fs_1.writeFileSync)(cf, text, "utf8");
    return { text, cached: false, promptHash };
}
function runClaude(bin, prompt, timeoutMs) {
    return new Promise((resolve, reject) => {
        const proc = (0, node_child_process_1.spawn)(bin, ["-p", prompt], {
            stdio: ["ignore", "pipe", "pipe"],
            shell: false,
        });
        let stdout = "";
        let stderr = "";
        const timer = setTimeout(() => {
            proc.kill();
            reject(new ClaudexError(`Claude CLI timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        proc.stdout.setEncoding("utf8");
        proc.stderr.setEncoding("utf8");
        proc.stdout.on("data", (d) => (stdout += d));
        proc.stderr.on("data", (d) => (stderr += d));
        proc.on("error", (err) => {
            clearTimeout(timer);
            reject(new ClaudexError(`Claude CLI spawn error: ${err.message}`));
        });
        proc.on("close", (code) => {
            clearTimeout(timer);
            if (code !== 0) {
                reject(new ClaudexError(`Claude CLI exit ${code}: ${stderr.trim().slice(0, 500)}`));
                return;
            }
            const text = stdout.trim();
            if (!text) {
                reject(new ClaudexError("Claude CLI returned empty stdout."));
                return;
            }
            resolve(text);
        });
    });
}
const JSON_FENCE = /```(?:json)?\s*([\s\S]*?)\s*```/;
function extractJson(text) {
    const candidates = [];
    const m = JSON_FENCE.exec(text);
    if (m)
        candidates.push(m[1]);
    candidates.push(text);
    for (const c of candidates) {
        try {
            return JSON.parse(c.trim());
        }
        catch {
            /* keep trying */
        }
    }
    throw new ClaudexError(`Could not parse JSON from response. Got: ${text.slice(0, 300)}`);
}
async function askJson(prompt, opts = {}) {
    const r = await ask(prompt, opts);
    return extractJson(r.text);
}
async function askBatch(opts) {
    const itemLabel = opts.itemLabel ?? "item";
    const extraKeys = opts.extraKeys ?? ["category"];
    const schema = "{" +
        [`"${itemLabel}": "<string>"`, ...extraKeys.map((k) => `"${k}": "<string>"`)].join(", ") +
        "}";
    const itemsBlock = opts.items.map((x) => `- ${x}`).join("\n");
    const prompt = `${opts.instruction}\n\n` +
        `Items:\n${itemsBlock}\n\n` +
        `Return ONLY a JSON array. No prose, no markdown fences. Each element is:\n` +
        `  ${schema}\n` +
        `Return one element per item, in the same order.`;
    const data = await askJson(prompt, opts);
    if (!Array.isArray(data)) {
        throw new ClaudexError(`Expected JSON array, got ${typeof data}`);
    }
    return data;
}
/**
 * Stream Claude's response as it generates. Yields one StreamEvent per JSON
 * line emitted on the CLI's stdout. Text events arrive incrementally;
 * "result" arrives once at the end with the full string.
 *
 * Streaming bypasses the cache (no useful semantics for partial responses).
 *
 * Usage:
 *   for await (const ev of askStream(prompt)) {
 *     if (ev.type === "text") process.stdout.write(ev.text);
 *   }
 */
async function* askStream(prompt, opts = {}) {
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const bin = resolveClaudeBin();
    const proc = (0, node_child_process_1.spawn)(bin, ["-p", prompt, "--output-format", "stream-json", "--verbose"], { stdio: ["ignore", "pipe", "pipe"], shell: false });
    let stderr = "";
    proc.stderr.setEncoding("utf8");
    proc.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => {
        try {
            proc.kill();
        }
        catch { /* ignore */ }
    }, timeoutMs);
    const queue = [];
    const waiters = [];
    const push = (t) => {
        if (waiters.length > 0)
            waiters.shift()(t);
        else
            queue.push(t);
    };
    const next = () => new Promise((resolve) => {
        if (queue.length > 0)
            resolve(queue.shift());
        else
            waiters.push(resolve);
    });
    proc.stdout.setEncoding("utf8");
    let buf = "";
    proc.stdout.on("data", (chunk) => {
        buf += chunk;
        let nl;
        // eslint-disable-next-line no-cond-assign
        while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).replace(/\r$/, "");
            buf = buf.slice(nl + 1);
            if (line.trim())
                push({ kind: "line", value: line });
        }
    });
    proc.on("close", (code) => {
        if (buf.trim())
            push({ kind: "line", value: buf });
        push({ kind: "close", code });
    });
    proc.on("error", (err) => push({ kind: "error", err }));
    let lastTextLen = 0;
    try {
        while (true) {
            const tick = await next();
            if (tick.kind === "error")
                throw new ClaudexError(`Claude CLI spawn error: ${tick.err.message}`);
            if (tick.kind === "close") {
                if (tick.code !== 0) {
                    throw new ClaudexError(`Claude CLI exit ${tick.code}: ${stderr.trim().slice(0, 500)}`);
                }
                return;
            }
            let ev;
            try {
                ev = JSON.parse(tick.value);
            }
            catch {
                continue;
            }
            const etype = ev.type;
            if (etype === "assistant") {
                const msg = ev.message;
                const blocks = msg?.content ?? [];
                const full = blocks
                    .filter((b) => b.type === "text")
                    .map((b) => b.text ?? "")
                    .join("");
                if (full.length > lastTextLen) {
                    const delta = full.slice(lastTextLen);
                    lastTextLen = full.length;
                    yield { type: "text", text: delta, raw: ev };
                }
            }
            else if (etype === "result") {
                yield { type: "result", text: String(ev.result ?? ""), raw: ev };
            }
            else if (etype === "error" || ev.is_error) {
                yield { type: "error", text: String(ev.error ?? tick.value), raw: ev };
            }
            // ignore "system", "rate_limit_event", etc.
        }
    }
    finally {
        clearTimeout(timer);
        if (proc.exitCode === null) {
            try {
                proc.kill();
            }
            catch { /* ignore */ }
        }
    }
}
function clearCache(projectRoot) {
    const dir = path.join(projectRoot ?? process.cwd(), CACHE_DIRNAME);
    if (!(0, node_fs_1.existsSync)(dir))
        return 0;
    let n = 0;
    for (const f of (0, node_fs_1.readdirSync)(dir)) {
        if (f.endsWith(".txt")) {
            (0, node_fs_1.unlinkSync)(path.join(dir, f));
            n++;
        }
    }
    return n;
}
async function healthCheck() {
    const info = { ok: false, claudeBin: null };
    try {
        info.claudeBin = resolveClaudeBin();
        const r = await ask("Reply with the literal text 'CLAUDEX_OK' and nothing else.", {
            useCache: false,
            timeoutMs: 30_000,
        });
        info.sampleResponse = r.text;
        info.ok = r.text.includes("CLAUDEX_OK");
    }
    catch (e) {
        info.error = e.message;
    }
    return info;
}
// CLI entry: `node claudex.js` runs healthCheck and prints JSON
// (Node 22+ can `node --experimental-strip-types claudex.ts`)
if (typeof require !== "undefined" && require.main === module) {
    healthCheck().then((info) => {
        console.log(JSON.stringify(info, null, 2));
        process.exit(info.ok ? 0 : 1);
    });
}
