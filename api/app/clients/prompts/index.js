const formatMessages = require('./formatMessages');
const summaryPrompts = require('./summaryPrompts');
const handleInputs = require('./handleInputs');
const instructions = require('./instructions');
const truncate = require('./truncate');
const createVisionPrompt = require('./createVisionPrompt');
const createContextHandlers = require('./createContextHandlers');
const contextClipFilter = require('./contextClipFilter');
const contextClipWithSummary = require('./contextClipWithSummary');

module.exports = {
  ...formatMessages,
  ...summaryPrompts,
  ...handleInputs,
  ...instructions,
  ...truncate,
  createVisionPrompt,
  createContextHandlers,
  ...contextClipFilter,
  ...contextClipWithSummary,
};
