const mongoose = require('mongoose');

const entitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['PROTEIN', 'GENE', 'DISEASE', 'DRUG', 'ORGANISM', 'CELL_TYPE', 'TISSUE', 'PATHWAY', 'CONCEPT', 'METHOD', 'OTHER']
  },
  aliases: [String],
  description: String,
  externalIds: {
    uniprot: String,
    ncbi: String,
    pubchem: String,
    mesh: String,
    go: String
  },
  papers: [{
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paper'
    },
    mentionCount: {
      type: Number,
      default: 1
    },
    contexts: [String]
  }],
  properties: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
entitySchema.index({ name: 'text', aliases: 'text' });
entitySchema.index({ type: 1 });
entitySchema.index({ 'papers.paperId': 1 });

module.exports = mongoose.model('Entity', entitySchema);
