// Условия и материалы для поставщика — статический JSON в репозитории (D-041), один источник для mock и http.
// Каждый файл: { terms: RichText, materials: OfferMaterial[] }; материалы двуязычные, объединяются по id.
import { z } from 'zod';

import { OfferContentSchema, OfferMaterialSchema, RichTextSchema, type OfferContent } from '../../ports/schemas';
import ar from '../../../../../content/offer.ar.json';
import en from '../../../../../content/offer.en.json';

const OfferFileSchema = z.object({ terms: RichTextSchema, materials: z.array(OfferMaterialSchema) });

export function loadOfferContent(): OfferContent {
  const a = OfferFileSchema.parse(ar);
  const e = OfferFileSchema.parse(en);
  const materials = [...a.materials, ...e.materials.filter((m) => !a.materials.some((x) => x.id === m.id))];
  return OfferContentSchema.parse({ terms: { ar: a.terms, en: e.terms }, materials });
}
