/**
 * Environnement HDR de la boule disco.
 * Même image que le preset drei « sunset », mais servie depuis notre domaine
 * (cache immuable + préchargement) au lieu d'un CDN tiers en cache 5 min.
 * Partagé entre la page (préchargement) et la scène 3D (chargement réel).
 */
export const HDR_ENV = '/hdr/venice_sunset_1k.hdr';
