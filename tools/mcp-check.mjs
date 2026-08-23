// The MCP check battery, wrapped as a kube-runnable entry: experiment arms
// may only name committed tools/**.mjs (kube.mjs's contract), and the KUBE
// POLICY routes every gate through the cluster - so the battery gets a
// tools/ door. It imports the real harness unchanged; the receipt is the
// harness's own output and exit code.
await import(new URL("../mcp/test-server.mjs", import.meta.url));
