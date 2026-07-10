import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, listAll, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBjbpNnEBnrMbL3GLI1xq6KeaGm3bI5NcE',
  authDomain: 'pulseindexai-c0c19.firebaseapp.com',
  projectId: 'pulseindexai-c0c19',
  storageBucket: 'pulseindexai-c0c19.firebasestorage.app',
  messagingSenderId: '775121657401',
  appId: '1:775121657401:web:d67313d2812863b190f7e8'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Collections to clear — users collection is intentionally excluded
const COLLECTIONS_TO_CLEAR = [
  'health_records',
  'patient_profiles',
  'provider_consents',
  'consent_signatures',
  'consent_audit_logs',
  'blockchain_audit_logs',
  'pending_requests',
  'emergency_contacts'
];

async function clearCollection(collectionName) {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  if (snapshot.empty) {
    console.log(`  ✓ ${collectionName} — already empty`);
    return 0;
  }
  const deletes = snapshot.docs.map(d => deleteDoc(doc(db, collectionName, d.id)));
  await Promise.all(deletes);
  console.log(`  ✓ ${collectionName} — deleted ${snapshot.docs.length} document(s)`);
  return snapshot.docs.length;
}

async function clearStorageFolder(folderPath) {
  try {
    const folderRef = ref(storage, folderPath);
    const list = await listAll(folderRef);
    const deletes = list.items.map(item => deleteObject(item));
    await Promise.all(deletes);
    // Recurse into sub-folders
    for (const prefix of list.prefixes) {
      await clearStorageFolder(prefix.fullPath);
    }
    if (list.items.length > 0) {
      console.log(`  ✓ Storage /${folderPath} — deleted ${list.items.length} file(s)`);
    }
    return list.items.length;
  } catch (e) {
    if (e.code === 'storage/object-not-found') return 0;
    throw e;
  }
}

async function main() {
  console.log('\n🗑️  MediGuard AI — Data Clear Script');
  console.log('═══════════════════════════════════════');
  console.log('Keeping: users collection (accounts safe)');
  console.log('───────────────────────────────────────\n');

  console.log('📂 Clearing Firestore collections...');
  let totalDocs = 0;
  for (const col of COLLECTIONS_TO_CLEAR) {
    totalDocs += await clearCollection(col);
  }

  console.log('\n🗃️  Clearing Firebase Storage files...');
  const totalFiles = await clearStorageFolder('');

  console.log('\n═══════════════════════════════════════');
  console.log(`✅ Done! Removed ${totalDocs} documents and ${totalFiles} storage files.`);
  console.log('   User accounts remain untouched.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
