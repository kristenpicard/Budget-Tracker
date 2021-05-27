const request = indexedDB.open(budgetTracker, 1);
let db;

request.onupgradeneeded = function (e) {
  const db = request.result;
  db.createObjectStore("newTransaction", { autoIncrement: true });
};

request.onerror = function (e) {
  console.log(e.target.errorCode);
};

request.onsuccess = function (e) {
  db = request.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};

export function checkDatabase() {
  // Opens a transaction on waiting database
  const transaction = db.transaction(["newTransaction"], "readwrite");
  // Accesses the waiting Object Store
  const budgetObjectStore = transaction.objectStore("newTransaction");
  // Gets all records from store and set to a variable
  const getAll = budgetObjectStore.getAll();

  // Once all store items successfully accessed...
  getAll.onsuccess = function () {
    // If data in store, sent to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          // Open another transaction
          const transaction = db.transaction(["newTransaction"], "readwrite");

          // Access the new_transaction object store
          const budgetObjectStore = transaction.objectStore("newTransaction");

          // Clear all items in your store
          budgetObjectStore.clear();
        });
    }
  };
}

// Called if we attempt to POST a new transaction and no internet connection
export function saveRecord(record) {
  // Opens a transaction on waiting database
  const transaction = db.transaction(["newTransaction"], "readwrite");

  // Accesses the waiting Object Store
  const budgetObjectStore = transaction.objectStore("newTransaction");

  // Adds the record to Store
  budgetObjectStore.add(record);
}

// Listen for app coming back online
window.addEventListener("online", uploadTransaction);
