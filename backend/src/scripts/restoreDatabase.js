require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { EJSON } = require('bson');
const { buildDirectMongoUri } = require('../utils/mongoUri');

const parseArgs = () => {
  const options = {
    backupPath: '',
    drop: false,
    collections: []
  };

  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--path=')) {
      options.backupPath = path.resolve(process.cwd(), arg.split('=')[1]);
      return;
    }

    if (arg === '--drop') {
      options.drop = true;
      return;
    }

    if (arg.startsWith('--collections=')) {
      options.collections = arg.split('=')[1].split(',').map((item) => item.trim()).filter(Boolean);
    }
  });

  return options;
};

const restoreIndexes = async (collection, indexDefinitions = []) => {
  for (const index of indexDefinitions) {
    if (index.name === '_id_') {
      continue;
    }

    const options = { ...index };
    delete options.v;
    delete options.ns;
    delete options.key;

    await collection.createIndex(index.key, options);
  }
};

const main = async () => {
  const options = parseArgs();
  if (!options.backupPath) {
    throw new Error('Missing required --path argument');
  }

  const metadataPath = path.join(options.backupPath, 'metadata.json');
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Backup metadata was not found at ${metadataPath}`);
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const collections = (metadata.collections || [])
    .map((item) => item.name)
    .filter((name) => options.collections.length === 0 || options.collections.includes(name));

  const mongoUri = await buildDirectMongoUri(process.env.MONGODB_URI);
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  const restored = [];

  for (const name of collections) {
    const dataPath = path.join(options.backupPath, `${name}.data.ejson`);
    const indexesPath = path.join(options.backupPath, `${name}.indexes.ejson`);
    if (!fs.existsSync(dataPath) || !fs.existsSync(indexesPath)) {
      throw new Error(`Missing backup files for collection ${name}`);
    }

    const documents = EJSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const indexes = EJSON.parse(fs.readFileSync(indexesPath, 'utf8'));
    const collection = db.collection(name);

    if (options.drop) {
      await collection.deleteMany({});
    } else {
      const existingCount = await collection.countDocuments({});
      if (existingCount > 0) {
        throw new Error(`Collection ${name} is not empty. Use --drop to restore into a populated collection.`);
      }
    }

    if (documents.length) {
      await collection.insertMany(documents, { ordered: false });
    }

    await restoreIndexes(collection, indexes);
    restored.push({
      name,
      documentCount: documents.length,
      indexCount: indexes.length
    });
  }

  console.log(JSON.stringify({
    ok: true,
    backupPath: options.backupPath,
    restored
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
