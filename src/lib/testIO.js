export const downloadTest = (test) => {
  const jsonString = JSON.stringify(
    {
      name: test.name,
      type: test.type,
      questions: test.questions,
      settings: test.settings,
      exportedAt: new Date().toISOString(),
      version: "2.0",
    },
    null,
    2,
  );
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${test.name}_test.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateShareCode = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // Unambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// Chunked conversion: spreading a large Uint8Array into String.fromCharCode
// can exceed the argument limit, so it is converted in slices.
const bytesToBase64 = (bytes) => {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
};

export const uploadSharedTest = async (test) => {
  const [{ doc, setDoc, deleteDoc }, { getDb }, { default: pako }] =
    await Promise.all([
      import("firebase/firestore"),
      import("../firebase.js"),
      import("pako"),
    ]);
  const db = await getDb();

  const code = generateShareCode();
  const sharedTest = {
    ...test,
    pages: [], // Remove pages to save space
    questions: test.questions.map((q) => ({
      ...q,
      image: q.image ? "[image]" : null, // Strip base64 images
    })),
    createdAt: new Date().toISOString(),
  };
  // Compress the test data
  const jsonString = JSON.stringify(sharedTest);
  const compressed = pako.gzip(jsonString);
  const base64Compressed = bytesToBase64(compressed);
  await setDoc(doc(db, "sharedTests", code), {
    data: base64Compressed,
    createdAt: new Date().toISOString(),
  });
  // Delete after 5 minutes
  setTimeout(async () => {
    try {
      await deleteDoc(doc(db, "sharedTests", code));
    } catch (e) {
      void e;
    }
  }, 5 * 60 * 1000);
  return code;
};

export const fetchSharedTest = async (code) => {
  const [{ doc, getDoc, deleteDoc }, { getDb }, { default: pako }] =
    await Promise.all([
      import("firebase/firestore"),
      import("../firebase.js"),
      import("pako"),
    ]);
  const db = await getDb();

  const docSnap = await getDoc(doc(db, "sharedTests", code));
  if (!docSnap.exists()) {
    throw new Error("Code not found or expired");
  }
  const data = docSnap.data();
  const createdAt = new Date(data.createdAt);
  const now = new Date();
  if (now - createdAt > 5 * 60 * 1000) {
    await deleteDoc(doc(db, "sharedTests", code));
    throw new Error("Code expired");
  }
  // Decompress the test data
  const compressedData = atob(data.data);
  const compressedBytes = new Uint8Array(
    compressedData.split("").map((c) => c.charCodeAt(0)),
  );
  const decompressed = pako.ungzip(compressedBytes, { to: "string" });
  return JSON.parse(decompressed);
};
