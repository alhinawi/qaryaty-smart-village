// ─── The search screen's code loads on its own, the first time it is needed or when the phone is idle
let loading: Promise<typeof import('./SearchScreen')> | null = null;

export function preloadSearchScreen() {
  loading ??= import('./SearchScreen').catch((error: unknown) => {
    loading = null; // a dropped connection can try again
    throw error;
  });
  return loading;
}
