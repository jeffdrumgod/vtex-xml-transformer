import { ProductImage } from 'productDetails';

export type ImageSelector = {
  index?: number;
  match?: string;
};

const first = (value: unknown): string | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null) return undefined;
  return `${raw}`;
};

/**
 * Lê imageIndex / imageMatch da query. Retorna undefined quando nenhum informado.
 * Validação (inteiro >= 0, exclusividade) fica no RequestHandler.
 */
export const parseImageSelector = (query: Record<string, unknown>): ImageSelector | undefined => {
  const match = first(query.imageMatch)?.trim();
  if (match) return { match };

  const rawIndex = first(query.imageIndex);
  if (rawIndex !== undefined && rawIndex !== '') {
    const index = Number.parseInt(rawIndex, 10);
    if (Number.isInteger(index) && index >= 0) return { index };
  }

  return undefined;
};

// ignora query string (?v= cache-buster da VTEX): número no ?v= casaria com imagem errada
const urlPath = (url: string) => url.split('?')[0];

/**
 * Escolhe imagem por seletor. match: substring case-insensitive em imageText ou imageUrl (sem query string).
 * index: posição 0-based. Sem seletor, sem match ou imagem sem URL retorna undefined (caller aplica fallback).
 */
export const selectImage = (images: ProductImage[], selector?: ImageSelector): ProductImage | undefined => {
  if (!selector) return undefined;

  if (selector.match) {
    const needle = selector.match.toLowerCase();
    const matches = (img: ProductImage) => {
      if (!img.imageUrl) return false;
      return img.imageText?.toLowerCase().includes(needle) || urlPath(img.imageUrl).toLowerCase().includes(needle);
    };
    return images.find(matches);
  }

  if (selector.index !== undefined) {
    const img = images[selector.index];
    return img?.imageUrl ? img : undefined;
  }

  return undefined;
};
