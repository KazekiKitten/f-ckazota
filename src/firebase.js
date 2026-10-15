import { firebaseConfig } from "./lib/firebaseConfig";

let appPromise = null;

const getApp = () => {
  appPromise ??= (async () => {
    const [{ initializeApp }, { getFirestore }] = await Promise.all([
      import("firebase/app"),
      import("firebase/firestore"),
    ]);
    const app = initializeApp(firebaseConfig);
    return { app, getFirestore };
  })();
  return appPromise;
};

let dbPromise = null;

// The Firebase SDK is only ever loaded through these lazy accessors, keeping
// it out of the startup bundle until auth or sync actually needs it.

export const getDb = () => {
  dbPromise ??= (async () => {
    const { app, getFirestore } = await getApp();
    return getFirestore(app);
  })();
  return dbPromise;
};

let authPromise = null;

export const getAuthInstance = () => {
  authPromise ??= (async () => {
    const [{ getAuth, GoogleAuthProvider }, { app }] = await Promise.all([
      import("firebase/auth"),
      getApp(),
    ]);
    return { auth: getAuth(app), GoogleAuthProvider };
  })();
  return authPromise;
};
