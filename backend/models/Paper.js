const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  authors: [{
    name: String,
    affiliation: String,
    email: String
  }],
  abstract: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  doi: {
    type: String,
    unique: true,
    sparse: true
  },
  pubmedId: {
    type: String,
    unique: true,
    sparse: true
  },
  arxivId: {
    type: String,
    unique: true,
    sparse: true
  },
  journal: {
    name: String,
    volume: String,
    issue: String,
    pages: String
  },
  publishedDate: {
    type: Date,
    index: true
  },
  keywords: [String],
  categories: [String],
  citations: [{
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paper'
    },
    context: String
  }],
  extractedEntities: [{
    text: String,
    type: {
      type: String,
      enum: ['PROTEIN', 'GENE', 'DISEASE', 'DRUG', 'ORGANISM', 'CELL_TYPE', 'TISSUE', 'PATHWAY', 'OTHER']
    },
    confidence: Number,
    positions: [{
      start: Number,
      end: Number
    }]
  }],
  relationships: [{
    subject: String,
    predicate: String,
    object: String,
    confidence: Number,
    evidence: String
  }],
  processingStatus: {
    type: String,
    enum: ['UPLOADED', 'PROCESSING', 'ANALYZED', 'FAILED'],
    default: 'UPLOADED'
  },
  analysisResults: {
    summary: String,
    keyFindings: [String],
    methodology: String,
    limitations: [String],
    futureWork: [String]
  },
  uploadedBy: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
paperSchema.index({ title: 'text', abstract: 'text', content: 'text' });
paperSchema.index({ 'extractedEntities.text': 1 });
paperSchema.index({ 'extractedEntities.type': 1 });
paperSchema.index({ publishedDate: -1 });
paperSchema.index({ categories: 1 });

module.exports = mongoose.model('Paper', paperSchema);
