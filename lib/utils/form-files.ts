/** Bytes of uploaded form files, in order. */
export function readFiles(files: File[]): Promise<Uint8Array[]> {
  return Promise.all(files.map(async (file) => new Uint8Array(await file.arrayBuffer())));
}
