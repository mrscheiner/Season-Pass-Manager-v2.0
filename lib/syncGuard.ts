interface RefreshOnLoadOptions {
  fetchLatest: () => Promise<void>;
}

export async function refreshOnLoad(options: RefreshOnLoadOptions): Promise<void> {
  try {
    await options.fetchLatest();
  } catch (error) {
    console.error('[syncGuard] refreshOnLoad error:', error);
    throw error;
  }
}
