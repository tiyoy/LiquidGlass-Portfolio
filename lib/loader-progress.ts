/**
 * Logika progres loading screen (fungsi murni, tidak bergantung pada React).
 *
 * Persentase dihitung dari 6 tahap yang benar-benar diukur, bukan animasi palsu:
 *   font (10) + data dari database (30) + gambar dari database (20)
 *   + kode lanyard 3D (10) + gambar kartu lanyard termasuk foto profil (15)
 *   + frame pertama lanyard sudah tergambar (15) = 100
 */

export type LoaderState = {
  fonts: boolean;
  data: boolean;
  /** null = belum mulai (menunggu data); total 0 = tidak ada gambar yang perlu dimuat */
  images: { done: number; total: number } | null;
  chunk: boolean;
  art: boolean;
  lanyard: boolean;
  /** pengaman: dipaksa selesai kalau ada tahap yang macet terlalu lama */
  forced?: boolean;
};

export const LOADER_WEIGHTS = { fonts: 10, data: 30, images: 20, chunk: 10, art: 15, lanyard: 15 } as const;

export function computeLoaderTarget(state: LoaderState): number {
  if (state.forced) return 100;
  const imageFraction = !state.data || !state.images
    ? 0
    : state.images.total === 0 ? 1 : Math.min(1, state.images.done / state.images.total);
  const sum =
    (state.fonts ? LOADER_WEIGHTS.fonts : 0) +
    (state.data ? LOADER_WEIGHTS.data : 0) +
    imageFraction * LOADER_WEIGHTS.images +
    (state.chunk ? LOADER_WEIGHTS.chunk : 0) +
    (state.art ? LOADER_WEIGHTS.art : 0) +
    (state.lanyard ? LOADER_WEIGHTS.lanyard : 0);
  return Math.min(100, Math.round(sum));
}

export function isLoaderComplete(state: LoaderState): boolean {
  if (state.forced) return true;
  return state.fonts && state.data && state.images !== null && state.images.done >= state.images.total
    && state.chunk && state.art && state.lanyard;
}

/** Satu langkah animasi angka: mendekati batas (cap) dengan halus dan tidak pernah melewatinya. */
export function stepDisplay(current: number, cap: number): number {
  if (current >= cap) return current;
  return Math.min(cap, current + Math.max(0.4, (cap - current) * 0.12));
}
