const mongoose = require('mongoose');

const relationshipSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entity',
    required: true
  },
  predicate: {
    type: String,
    required: true,
    enum: [
      'INTERACTS_WITH',
      'REGULATES',
      'INHIBITS',
      'ACTIVATES',
      'BINDS_TO',
      'LOCATED_IN',
      'PART_OF',
      'CAUSES',
      'TREATS',
      'ASSOCIATED_WITH',
      'SIMILAR_TO',
      'EXPRESSED_IN',
      'METABOLIZES',
      'SYNTHESIZES'
    ]
  },
  object: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entity',
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  evidence: [{
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paper'
    },
    sentence: String,
    position: {
      start: Number,
      end: Number
    }
  }],
  strength: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  direction: {
    type: String,
    enum: ['BIDIRECTIONAL', 'UNIDIRECTIONAL'],
    default: 'UNIDIRECTIONAL'
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
relationshipSchema.index({ subject: 1, predicate: 1, object: 1 }, { unique: true });
relationshipSchema.index({ subject: 1 });
relationshipSchema.index({ object: 1 });
relationshipSchema.index({ predicate: 1 });

module.exports = mongoose.model('Relationship', relationshipSchema);