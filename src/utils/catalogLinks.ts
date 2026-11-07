export type CatalogKind = 'shop' | 'provider' | 'service';
export function catalogPath(kind: CatalogKind, id: number) { return `/${kind}s/${id}`; }
export function catalogShareUrl(kind: CatalogKind, id: number, origin = window.location.origin) { return `${origin}/share/${kind}/${id}`; }
export function validCatalogId(value: string | undefined) { return !!value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)); }
