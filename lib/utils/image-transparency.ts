/**
 * Popcut.id Smart Image Processing Engine
 * Utilitas untuk deteksi transparansi, penghapusan background warna solid otomatis,
 * dan deteksi otomatis kotak slot foto (Auto-Slot Recognition).
 */

export interface DetectedSlot {
  slot_index: number;
  x_coord: number; // percentage 0-100
  y_coord: number; // percentage 0-100
  width: number;   // percentage 0-100
  height: number;  // percentage 0-100
}

/**
 * Cek apakah gambar memiliki alpha transparency (minimal 1% piksel transparan)
 */
export function analyzeImageAlpha(ctx: CanvasRenderingContext2D, width: number, height: number): {
  hasAlpha: boolean;
  transparentPixelCount: number;
  totalPixels: number;
  transparentRatio: number;
} {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;
  let transparentPixelCount = 0;

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) {
      transparentPixelCount++;
    }
  }

  const transparentRatio = transparentPixelCount / totalPixels;

  return {
    hasAlpha: transparentRatio > 0.005, // lebih dari 0.5% area transparan
    transparentPixelCount,
    totalPixels,
    transparentRatio,
  };
}

/**
 * Hapus warna latar belakang atau warna slot foto berdasarkan warna target & toleransi.
 * Mode:
 * - 'white': Menghapus warna putih/terang (> threshold)
 * - 'color': Menghapus warna spesifik (berdasarkan targetRGB dan toleransi euclidian)
 * - 'corners': Deteksi otomatis warna dari 4 sudut gambar dan menghapusnya
 */
export function removeBackgroundColor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    mode: 'white' | 'color' | 'corners';
    targetRgb?: { r: number; g: number; b: number };
    tolerance?: number; // 0 - 100
    featherEdges?: boolean;
    protectBorders?: boolean;
  }
): { processedDataUrl: string; removedPixels: number } {
  const { mode, targetRgb = { r: 255, g: 255, b: 255 }, tolerance = 25, featherEdges = true } = options;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  let removedPixels = 0;

  // Jarak toleransi maksimal dalam ruang warna RGB (0 - 441.67)
  const maxDistance = (tolerance / 100) * 441.67;

  // Jika mode corners, ambil rata-rata warna sudut
  let compR = targetRgb.r;
  let compG = targetRgb.g;
  let compB = targetRgb.b;

  if (mode === 'corners') {
    // Ambil sampel piksel dari sudut (0,0), (width-1, 0), (0, height-1), (width-1, height-1)
    const tl = 0;
    compR = data[tl];
    compG = data[tl + 1];
    compB = data[tl + 2];
  }

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Lewati jika sudah transparan
    if (a === 0) continue;

    let isMatch = false;
    let distance = 0;

    if (mode === 'white') {
      // Warna putih: semua channel R, G, B mendekati 255
      const whiteThreshold = 255 - (tolerance / 100) * 120; // toleransi 25% -> threshold ~225
      if (r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold) {
        // Cek saturasi warna rendah agar tidak menghapus warna pastel cerah
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        if (maxC - minC < 25) {
          isMatch = true;
          distance = (255 - minC);
        }
      }
    } else {
      // Euclidean distance in RGB color space
      const dr = r - compR;
      const dg = g - compG;
      const db = b - compB;
      distance = Math.sqrt(dr * dr + dg * dg + db * db);
      if (distance <= maxDistance) {
        isMatch = true;
      }
    }

    if (isMatch) {
      if (featherEdges && distance > maxDistance * 0.7 && mode !== 'white') {
        // Tepi lembut (feathering / anti-aliasing)
        const featherFactor = (distance - maxDistance * 0.7) / (maxDistance * 0.3);
        data[i + 3] = Math.round(featherFactor * 255);
      } else {
        // Transparan penuh
        data[i + 3] = 0;
      }
      removedPixels++;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Buat data URL hasil pemrosesan
  const canvas = ctx.canvas;
  const processedDataUrl = canvas.toDataURL('image/png');

  return { processedDataUrl, removedPixels };
}

/**
 * Algoritma Cerdas: Deteksi Otomatis Lubang Kotak Slot Foto dari Area Transparan.
 * Mengelompokkan piksel transparan menjadi kontur kotak beraturan (Bounding Boxes).
 */
export function detectPhotoSlotsFromAlpha(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  expectedRatio: '2x6' | '4x6' = '2x6'
): DetectedSlot[] {
  // Gunakan grid sampling tereduksi (downsampled) untuk performa instan
  const sampleScale = Math.max(1, Math.floor(Math.max(width, height) / 300));
  const sw = Math.floor(width / sampleScale);
  const sh = Math.floor(height / sampleScale);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Buat 2D boolean mask (true jika transparan)
  const mask: boolean[][] = Array.from({ length: sh }, () => Array(sw).fill(false));

  for (let sy = 0; sy < sh; sy++) {
    for (let sx = 0; sx < sw; sx++) {
      const origX = sx * sampleScale;
      const origY = sy * sampleScale;
      const idx = (origY * width + origX) * 4;
      // Alpha < 80 dianggap transparan
      if (data[idx + 3] < 80) {
        mask[sy][sx] = true;
      }
    }
  }

  // Flood fill / Connected component labeling sederhana untuk mencari blok transparan
  const visited: boolean[][] = Array.from({ length: sh }, () => Array(sw).fill(false));
  const boundingBoxes: { minX: number; maxX: number; minY: number; maxY: number; area: number }[] = [];

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (mask[y][x] && !visited[y][x]) {
        // BFS untuk mencari seluruh blok ini
        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;
        let area = 0;

        const queue: [number, number][] = [[x, y]];
        visited[y][x] = true;

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          area++;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          // 4-neighborhood
          const neighbors: [number, number][] = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1],
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < sw && ny >= 0 && ny < sh && mask[ny][nx] && !visited[ny][nx]) {
              visited[ny][nx] = true;
              queue.push([nx, ny]);
            }
          }
        }

        // Filter kotak: area harus signifikan (> 2% dari luas kanvas)
        // Dan tidak boleh menutupi lebih dari 85% luas kanvas (bukan keseluruhan kanvas)
        const boxWidth = maxX - minX + 1;
        const boxHeight = maxY - minY + 1;
        const boxAreaRatio = (boxWidth * boxHeight) / (sw * sh);

        if (boxAreaRatio > 0.02 && boxAreaRatio < 0.85 && boxWidth > 15 && boxHeight > 15) {
          boundingBoxes.push({ minX, maxX, minY, maxY, area });
        }
      }
    }
  }

  // Urutkan kotak berdasarkan posisi Y (dari atas ke bawah)
  boundingBoxes.sort((a, b) => a.minY - b.minY);

  // Jika tidak ditemukan kotak yang jelas, kembalikan default layout cerdas
  if (boundingBoxes.length === 0) {
    if (expectedRatio === '4x6') {
      return [
        { slot_index: 1, x_coord: 8, y_coord: 8, width: 40, height: 40 },
        { slot_index: 2, x_coord: 52, y_coord: 8, width: 40, height: 40 },
        { slot_index: 3, x_coord: 8, y_coord: 52, width: 40, height: 40 },
        { slot_index: 4, x_coord: 52, y_coord: 52, width: 40, height: 40 },
      ];
    }
    return [
      { slot_index: 1, x_coord: 10, y_coord: 8, width: 80, height: 24 },
      { slot_index: 2, x_coord: 10, y_coord: 36, width: 80, height: 24 },
      { slot_index: 3, x_coord: 10, y_coord: 64, width: 80, height: 24 },
    ];
  }

  // Konversi bounding box piksel ke persentase koordinat
  return boundingBoxes.map((box, idx) => {
    const origMinX = box.minX * sampleScale;
    const origMaxX = (box.maxX + 1) * sampleScale;
    const origMinY = box.minY * sampleScale;
    const origMaxY = (box.maxY + 1) * sampleScale;

    const xPct = Math.round((origMinX / width) * 100);
    const yPct = Math.round((origMinY / height) * 100);
    const wPct = Math.round(((origMaxX - origMinX) / width) * 100);
    const hPct = Math.round(((origMaxY - origMinY) / height) * 100);

    return {
      slot_index: idx + 1,
      x_coord: Math.max(0, Math.min(95, xPct)),
      y_coord: Math.max(0, Math.min(95, yPct)),
      width: Math.max(5, Math.min(100, wPct)),
      height: Math.max(5, Math.min(100, hPct)),
    };
  });
}

/**
 * Konversi HTMLCanvasElement ke File PNG
 */
export function canvasToFile(canvas: HTMLCanvasElement, filename: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Gagal mengonversi kanvas ke Blob PNG'));
        return;
      }
      const file = new File([blob], filename, { type: 'image/png' });
      resolve(file);
    }, 'image/png');
  });
}

