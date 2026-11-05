// Публичный API сегмента shared/lib.
export { now, nowDate, setClock, toDate } from './clock';
export { onStorageUnavailable, sessionStore, storage, storageKeyPrefix, type ScopedStorage } from './storage';
export { isInAppBrowser, isStandalone, platformOf, viewportOf } from './browser';
