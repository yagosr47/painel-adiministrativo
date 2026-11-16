import Busboy from 'busboy';

export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

/**
 * Recebe um multipart/form-data com um unico arquivo `file` e campos de texto.
 * Retorna { file: { buffer, ext, mime, filename, size }, fields }.
 * Rejeita payloads acima de MAX_IMAGE_BYTES e arquivos multiplos.
 */
export function readMultipartImage(req, { maxBytes = MAX_IMAGE_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    let busboy;
    try {
      busboy = Busboy({
        headers: req.headers,
        limits: { fileSize: maxBytes, files: 1, fields: 12, fieldSize: 4096 },
      });
    } catch {
      reject(Object.assign(new Error('Envio invalido: esperado multipart/form-data'), { status: 400 }));
      return;
    }

    const fields = {};
    let file = null;
    let failure = null;

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (name, stream, info) => {
      if (name !== 'file') {
        stream.resume();
        return;
      }
      const chunks = [];
      let size = 0;
      stream.on('data', (chunk) => {
        size += chunk.length;
        chunks.push(chunk);
      });
      stream.on('limit', () => {
        failure = Object.assign(new Error('Imagem maior que 6 MB'), { status: 413 });
      });
      stream.on('end', () => {
        if (failure) return;
        file = {
          buffer: Buffer.concat(chunks),
          size,
          mime: info.mimeType,
          filename: info.filename,
        };
      });
    });

    busboy.on('error', (error) => reject(Object.assign(error, { status: 400 })));
    busboy.on('close', () => {
      if (failure) return reject(failure);
      resolve({ file, fields });
    });

    req.pipe(busboy);
  });
}
