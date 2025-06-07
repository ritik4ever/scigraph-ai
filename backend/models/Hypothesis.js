const mongoose = require('mongoose');

const hypothesisSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reasoning: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  supportingEvidence: [{
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paper'
    },
    relevanceScore: Number,
    excerpt: String
  }],
  relatedEntities: [{
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entity'
    },
    role: String
  }],
  testability: {
    score: {
      type: Number,
      min: 0,
      max: 1
    },
    methods: [String],
    resources: [String]
  },
  novelty: {
    score: {
      type: Number,
      min: 0,
      max: 1
    },
    reasoning: String
  },
  impact: {
    score: {
      type: Number,
      min: 0,
      max: 1
    },
    domains: [String]
  },
  status: {
    type: String,
    enum: ['GENERATED', 'UNDER_REVIEW', 'VALIDATED', 'REJECTED'],
    default: 'GENERATED'
  },
  votes: {
    upvotes: {
      type: Number,
      default: 0
    },
    downvotes: {
      type: Number,
      default: 0
    }
  },
  comments: [{
    user: String,
    text: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  generatedBy: {
    method: String,
    version: String,
    parameters: Object
  }
}, {
  timestamps: true
});

// Indexes
hypothesisSchema.index({ confidence: -1 });
hypothesisSchema.index({ 'novelty.score': -1 });
hypothesisSchema.index({ 'impact.score': -1 });
hypothesisSchema.index({ status: 1 });

module.exports = mongoose.model('Hypothesis', hypothesisSchema);