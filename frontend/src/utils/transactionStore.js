const DB_NAME = "expense_tracker_storage";
const DB_VERSION = 1;
const STORE_NAME = "transactions";
const LEGACY_TRANSACTION_PREFIX = "expense_tracker_transactions_v2";

const openDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const runStoreAction = async (mode, action) => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = action(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

export const getTransactionStoreKey = (userId = "guest") => {
  return `transactions:${userId || "guest"}`;
};

export const readStoredTransactions = async (userId) => {
  const key = getTransactionStoreKey(userId);
  const data = await runStoreAction("readonly", (store) => store.get(key));
  return Array.isArray(data) ? data : [];
};

export const writeStoredTransactions = async (userId, transactions) => {
  const key = getTransactionStoreKey(userId);
  await runStoreAction("readwrite", (store) => store.put(transactions, key));
};

export const migrateLegacyTransactions = async (userId) => {
  const legacyKeys = Object.keys(localStorage).filter((key) =>
    key.startsWith(LEGACY_TRANSACTION_PREFIX),
  );

  if (!legacyKeys.length) return [];

  const migrated = [];

  legacyKeys.forEach((key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(value)) {
        migrated.push(...value);
      }
    } catch {
      migrated.push();
    }

    localStorage.removeItem(key);
  });

  if (migrated.length) {
    await writeStoredTransactions(userId, migrated);
  }

  return migrated;
};

export const removeLegacyTransactionKeys = () => {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(LEGACY_TRANSACTION_PREFIX))
    .forEach((key) => localStorage.removeItem(key));
};
