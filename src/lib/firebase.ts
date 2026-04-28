import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Simple validation to prevent crashes locally
const isValidConfig = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId;

const app = initializeApp(isValidConfig ? firebaseConfig : {
  apiKey: "PLACEHOLDER",
  projectId: "PLACEHOLDER",
  appId: "PLACEHOLDER"
});

// Use initializeFirestore with long polling to bypass connectivity issues in sandbox/iframes (WebSockets are often blocked)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, (isValidConfig && firebaseConfig.firestoreDatabaseId) || undefined);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Error Handling Spec for Firestore Operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Global connection state
let isFirestoreConnected = false;

// Connection test as per system instructions
async function testConnection() {
  try {
    // Try to fetch with a timeout-like behavior using getDocFromServer
    // If this fails, it indicates a configuration or network issue
    const testDoc = doc(db, '_connection_test_', 'ping');
    await getDocFromServer(testDoc);
    isFirestoreConnected = true;
    console.log("Firestore connection verified successfully.");
  } catch (error: any) {
    if (error?.message?.includes('the client is offline') || error?.code === 'unavailable') {
      console.warn("Firestore backend currently unreachable. Operating in offline mode.");
      console.info("Please check if your Firebase Project ID and Database ID in firebase-applet-config.json are correct.");
    }
  }
}

testConnection();
