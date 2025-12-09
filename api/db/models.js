const mongoose = require('mongoose');
const { createModels } = require('@librechat/data-schemas');
const models = createModels(mongoose);

console.log('DB Models Loaded:', Object.keys(models));
module.exports = { ...models };
