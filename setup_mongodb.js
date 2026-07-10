import { MongoClient } from 'mongodb';

const MONGO_URI = 'mongodb://localhost:27017/';
const DB_NAME = 'mediguardai';

const run = async () => {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔌 Connecting to MongoDB at', MONGO_URI, '...');
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!\n');

    const db = client.db(DB_NAME);
    console.log(`📦 Using database: "${DB_NAME}"\n`);

    // ─── 1. users ────────────────────────────────────────────────────────────
    await db.createCollection('users').catch(() => null);
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('✅ Collection created: users (unique index on email)');

    // ─── 2. patient_profiles ─────────────────────────────────────────────────
    await db.createCollection('patient_profiles').catch(() => null);
    await db.collection('patient_profiles').createIndex({ patient_name: 1 }, { unique: true });
    await db.collection('patient_profiles').createIndex({ patient_uid: 1 }, { unique: true, sparse: true });
    console.log('✅ Collection created: patient_profiles');

    // ─── 3. health_records ───────────────────────────────────────────────────
    await db.createCollection('health_records').catch(() => null);
    await db.collection('health_records').createIndex({ id: 1 }, { unique: true });
    await db.collection('health_records').createIndex({ owner: 1 });
    console.log('✅ Collection created: health_records');

    // ─── 4. medical_documents ────────────────────────────────────────────────
    await db.createCollection('medical_documents').catch(() => null);
    await db.collection('medical_documents').createIndex({ id: 1 }, { unique: true });
    await db.collection('medical_documents').createIndex({ patient_id: 1 });
    console.log('✅ Collection created: medical_documents');

    // ─── 5. provider_consents ────────────────────────────────────────────────
    await db.createCollection('provider_consents').catch(() => null);
    await db.collection('provider_consents').createIndex({ id: 1 }, { unique: true });
    console.log('✅ Collection created: provider_consents');

    // ─── 6. pending_requests ─────────────────────────────────────────────────
    await db.createCollection('pending_requests').catch(() => null);
    await db.collection('pending_requests').createIndex({ id: 1 }, { unique: true });
    await db.collection('pending_requests').createIndex({ provider_id: 1 });
    await db.collection('pending_requests').createIndex({ target_patient_name: 1 });
    console.log('✅ Collection created: pending_requests');

    // ─── 7. blockchain_audit_logs ────────────────────────────────────────────
    await db.createCollection('blockchain_audit_logs').catch(() => null);
    await db.collection('blockchain_audit_logs').createIndex({ id: 1 }, { unique: true });
    await db.collection('blockchain_audit_logs').createIndex({ block_index: 1 });
    await db.collection('blockchain_audit_logs').createIndex({ actor: 1 });
    console.log('✅ Collection created: blockchain_audit_logs');

    // ─── 8. consent_signatures ───────────────────────────────────────────────
    await db.createCollection('consent_signatures').catch(() => null);
    await db.collection('consent_signatures').createIndex({ id: 1 }, { unique: true });
    await db.collection('consent_signatures').createIndex({ request_id: 1 });
    await db.collection('consent_signatures').createIndex({ patient_name: 1 });
    console.log('✅ Collection created: consent_signatures');

    // ─── 9. consent_audit_logs ───────────────────────────────────────────────
    await db.createCollection('consent_audit_logs').catch(() => null);
    await db.collection('consent_audit_logs').createIndex({ id: 1 }, { unique: true });
    await db.collection('consent_audit_logs').createIndex({ patient_name: 1 });
    console.log('✅ Collection created: consent_audit_logs');

    // ─── 10. emergency_contacts ──────────────────────────────────────────────
    await db.createCollection('emergency_contacts').catch(() => null);
    await db.collection('emergency_contacts').createIndex({ id: 1 }, { unique: true });
    console.log('✅ Collection created: emergency_contacts');

    // ─── Summary ─────────────────────────────────────────────────────────────
    const collections = await db.listCollections().toArray();
    console.log(`\n🎉 Database setup complete!`);
    console.log(`📊 Total collections in "${DB_NAME}": ${collections.length}`);
    console.log('Collections:', collections.map(c => c.name).join(', '));
    console.log('\n🔗 You can now view this database in MongoDB Compass at:');
    console.log('   mongodb://localhost:27017/\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Connection closed.');
  }
};

run();
