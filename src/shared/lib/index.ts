// Публичный API сегмента shared/lib.
export { now, nowDate, setClock, toDate } from './clock';
export { onStorageUnavailable, sessionStore, storage, storageKeyPrefix, type ScopedStorage } from './storage';
export { isInAppBrowser, isStandalone, platformOf, viewportOf } from './browser';
export { formatNationalInput, nationalDigits, pathHash, toKsaMobile } from './phone';
export { useNow } from './use-now';
export { ThemeProvider, useTheme, type ResolvedTheme, type ThemeChoice } from './theme';
export { network, useOnline } from './network';
export { useIsMobile } from './hooks/use-mobile';
export { sha256Hex } from './file-hash';
