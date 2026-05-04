export declare class ClaudexError extends Error {
    constructor(msg: string);
}
export interface AskOptions {
    projectRoot?: string;
    useCache?: boolean;
    timeoutMs?: number;
}
export interface Response {
    text: string;
    cached: boolean;
    promptHash: string;
}
export interface BatchOptions extends AskOptions {
    items: string[];
    instruction: string;
    itemLabel?: string;
    extraKeys?: string[];
}
export declare function ask(prompt: string, opts?: AskOptions): Promise<Response>;
export declare function askJson<T = unknown>(prompt: string, opts?: AskOptions): Promise<T>;
export declare function askBatch(opts: BatchOptions): Promise<Array<Record<string, string>>>;
/**
 * One event from `claude -p --output-format stream-json`.
 *
 * type:
 *   - "text"   — a chunk of model-generated text (delta).
 *   - "result" — final wrap-up event with full text + token usage.
 *   - "error"  — CLI-emitted error event.
 */
export interface StreamEvent {
    type: "text" | "result" | "error";
    text: string;
    raw: Record<string, unknown>;
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
export declare function askStream(prompt: string, opts?: {
    timeoutMs?: number;
}): AsyncGenerator<StreamEvent, void, unknown>;
export declare function clearCache(projectRoot?: string): number;
export interface HealthInfo {
    ok: boolean;
    claudeBin: string | null;
    sampleResponse?: string;
    error?: string;
}
export declare function healthCheck(): Promise<HealthInfo>;
