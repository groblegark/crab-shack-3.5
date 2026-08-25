// HOW MANY CORES DO WE ACTUALLY HAVE? - the one answer every forking tool asks.
//
// `os.cpus().length` answers a DIFFERENT question: how many cores does the
// HOST have. In a container that is the wrong number, and wrong in the
// dangerous direction. Measured in a gasboat `cs` fleet pod (2026-08-25):
// the pod is scheduled on a 16-core m5.4xlarge with `limits.cpu=4`, so
// cpus().length said 16 while the cgroup granted 4. headless.mjs then forked
// 15 sim workers and batch.mjs 14, onto a quota of four - a ~3.75x
// self-oversubscription that the kernel pays for in throttling (cpu.stat
// nr_throttled was already climbing) and that the 16Gi memory limit pays for
// in OOMKills, since a sim worker holds its worlds in one heap (kube runbook
// lesson #3: js slices OOM at 4Gi). Timings taken under throttling also lie,
// which quietly violates the "don't run two sims when benchmarking" rule
// while looking like a single run.
//
// So: ask the cgroup, and cross-check. `os.availableParallelism()` is
// libuv's answer and IS quota-aware on modern Node, but we also read
// cpu.max/cpu.cfs_quota_us ourselves and take the smaller - two independent
// derivations of the same quantity, which is the only way to notice when one
// of them is wrong.
import os from "os";
import { readFileSync } from "fs";

// The cgroup's CPU grant, or null when unlimited/unreadable (a bare host,
// a non-Linux box, cgroup paths absent). null means "no opinion", NOT zero.
function cgroupQuota() {
  try {                                     // cgroup v2: "<quota|max> <period>"
    const [q, p] = readFileSync("/sys/fs/cgroup/cpu.max", "utf8").trim().split(/\s+/);
    if (q !== "max") return Math.max(1, Math.floor(Number(q) / Number(p)));
    return null;
  } catch { /* fall through to v1 */ }
  try {                                     // cgroup v1: two files, -1 = unlimited
    const q = Number(readFileSync("/sys/fs/cgroup/cpu/cpu.cfs_quota_us", "utf8").trim());
    const p = Number(readFileSync("/sys/fs/cgroup/cpu/cpu.cfs_period_us", "utf8").trim());
    if (q > 0 && p > 0) return Math.max(1, Math.floor(q / p));
  } catch { /* not containerised, or no cgroup fs */ }
  return null;
}

// Cores this PROCESS may actually use. Never the host count.
export function usableCores() {
  const host = os.cpus().length;
  const libuv = typeof os.availableParallelism === "function" ? os.availableParallelism() : host;
  const quota = cgroupQuota();
  return Math.max(1, Math.min(libuv, quota ?? libuv));
}

// The default worker count for a forking tool: leave `reserve` cores for the
// parent process, the OS, and (in a fleet pod) whatever else shares the quota.
// `cap` clamps to the amount of work that exists - no point forking 15 workers
// for 3 seeds.
export function defaultJobs({ reserve = 1, cap = Infinity } = {}) {
  return Math.max(1, Math.min(cap, usableCores() - reserve));
}

// One line for --help/banner output, so a surprising job count is explainable
// from the log rather than re-derived by hand.
export function coresNote() {
  const q = cgroupQuota();
  return `cores: ${usableCores()} usable (host ${os.cpus().length}` +
    (q != null ? `, cgroup quota ${q}` : `, no cgroup quota`) + ")";
}
