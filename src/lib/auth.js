const getAuthBundle = async () => {
  const [authModule, { getAuthInstance }] = await Promise.all([
    import("firebase/auth"),
    import("../firebase"),
  ]);
  return { ...authModule, ...(await getAuthInstance()) };
};

export const signInWithGoogle = async () => {
  const { signInWithPopup, auth, GoogleAuthProvider } = await getAuthBundle();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const signOutUser = async () => {
  const { signOut, auth } = await getAuthBundle();
  await signOut(auth);
};

export const subscribeToAuth = (callback) => {
  let unsubscribe = () => {};
  let active = true;

  (async () => {
    try {
      const { onAuthStateChanged, auth } = await getAuthBundle();
      if (!active) return;
      unsubscribe = onAuthStateChanged(auth, callback);
    } catch {
      if (active) callback(null);
    }
  })();

  return () => {
    active = false;
    unsubscribe();
  };
};
