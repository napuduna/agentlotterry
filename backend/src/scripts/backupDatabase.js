require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { EJSON } = require('bson');
const { backupDir } = require('../config/env');
const { buildDirectMongoUri } = require('../utils/mongoUri');

const parseArgs = () => {
  const options = {
    tag: '',
    dir: backupDir,
    collections: []
  };

  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--tag=')) {
      options.tag = arg.split('=')[1];
      return;
    }

    if (arg.startsWith('--dir=')) {
      options.dir = path.resolve(process.cwd(), arg.split('=')[1]);
      return;
    }

    if (arg.startsWith('--collections=')) {
      options.collections = arg.split('=')[1].split(',').map((item) => item.trim()).filter(Boolean);
    }
  });

  return options;
};

const createBackupFolderName = (tag = '') => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return tag ? `${stamp}_${tag}` : stamp;
};

const main = async () => {
  const options = parseArgs();
  const mongoUri = await buildDirectMongoUri(process.env.MONGODB_URI);
  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const selectedCollections = collections
    .map((item) => item.name)
    .filter((name) => !name.startsWith('system.'))
    .filter((name) => options.collections.length === 0 || options.collections.includes(name))
    .sort();

  const backupPath = path.join(options.dir, createBackupFolderName(options.tag));
  fs.mkdirSync(backupPath, { recursive: true });

  const metadata = {
    startedAt: new Date().toISOString(),
    databaseName: db.databaseName,
    collections: []
  };

  for (const name of selectedCollections) {
    const collection = db.collection(name);
    const [documents, indexes] = await Promise.all([
      collection.find({}).toArray(),
      collection.indexes()
    ]);

    fs.writeFileSync(
      path.join(backupPath, `${name}.data.ejson`),
      EJSON.stringify(documents, null, 2, { relaxed: false })
    );
    fs.writeFileSync(
      path.join(backupPath, `${name}.indexes.ejson`),
      EJSON.stringify(indexes, null, 2, { relaxed: false })
    );

    metadata.collections.push({
      name,
      documentCount: documents.length,
      indexCount: indexes.length
    });
  }

  metadata.finishedAt = new Date().toISOString();
  metadata.path = backupPath;

  fs.writeFileSync(
    path.join(backupPath, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  console.log(JSON.stringify({
    ok: true,
    backupPath,
    collectionCount: metadata.collections.length,
    collections: metadata.collections
  }, null, 2));

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error.message || error);
  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
  }
  process.exit(1);
});
