function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (signal.aborted) { resolve(); return; }
    const finish = () => { clearTimeout(timer); signal.removeEventListener("abort", finish); resolve(); };
    const timer = setTimeout(finish, ms);
    signal.addEventListener("abort", finish, { once: true });
  });
}

export async function runLogoutTransition({ logout, signal, phase, navigate, durations = [900, 320, 440] }: {
  logout: () => Promise<void>;
  signal: AbortSignal;
  phase: (value: "complete" | "exit") => void;
  navigate: () => void;
  durations?: [number, number, number];
}) {
  await Promise.all([logout().catch(() => undefined), pause(durations[0], signal)]);
  if (signal.aborted) return;
  phase("complete");
  await pause(durations[1], signal);
  if (signal.aborted) return;
  phase("exit");
  await pause(durations[2], signal);
  if (!signal.aborted) navigate();
}
