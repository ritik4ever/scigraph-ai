const express = require('express');
const router = express.Router();
const Entity = require('../models/Entity');
const Relationship = require('../models/Relationship');
const Paper = require('../models/Paper');
const graphService = require('../services/graphService');

/**
 * @swagger
 * /api/knowledge-graph:
 *   get:
 *     summary: Get the complete knowledge graph
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of nodes to return
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;

    // Get entities with most connections
    const entities = await Entity.find()
      .sort({ 'papers.length': -1 })
      .limit(limit)
      .lean();

    // Get relationships between these entities
    const entityIds = entities.map(e => e._id);
    const relationships = await Relationship.find({
      subject: { $in: entityIds },
      object: { $in: entityIds }
    })
    .populate('subject', 'name type')
    .populate('object', 'name type')
    .lean();

    // Format for visualization
    const nodes = entities.map(entity => ({
      id: entity._id.toString(),
      name: entity.name,
      type: entity.type,
      size: entity.papers.length,
      confidence: entity.confidence
    }));

    const links = relationships.map(rel => ({
      source: rel.subject._id.toString(),
      target: rel.object._id.toString(),
      predicate: rel.predicate,
      confidence: rel.confidence,
      strength: rel.strength
    }));

    res.json({
      nodes,
      links,
      stats: {
        totalEntities: await Entity.countDocuments(),
        totalRelationships: await Relationship.countDocuments(),
        totalPapers: await Paper.countDocuments()
      }
    });

  } catch (error) {
    console.error('Knowledge graph error:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge graph' });
  }
});

/**
 * @swagger
 * /api/knowledge-graph/search:
 *   post:
 *     summary: Search the knowledge graph
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *               entityTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               maxDistance:
 *                 type: integer
 */
router.post('/search', async (req, res) => {
  try {
    const { query, entityTypes, maxDistance = 2 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Search entities
    let entityQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { aliases: { $regex: query, $options: 'i' } }
      ]
    };

    if (entityTypes && entityTypes.length > 0) {
      entityQuery.type = { $in: entityTypes };
    }

    const matchingEntities = await Entity.find(entityQuery).limit(50);

    if (matchingEntities.length === 0) {
      return res.json({ nodes: [], links: [], message: 'No entities found' });
    }

    // Find connected entities within maxDistance
    const connectedGraph = await graphService.findConnectedEntities(
      matchingEntities.map(e => e._id),
      maxDistance
    );

    res.json(connectedGraph);

  } catch (error) {
    console.error('Knowledge graph search error:', error);
    res.status(500).json({ error: 'Failed to search knowledge graph' });
  }
});

/**
 * @swagger
 * /api/knowledge-graph/path/{from}/{to}:
 *   get:
 *     summary: Find shortest path between two entities
 */
router.get('/path/:from/:to', async (req, res) => {
  try {
    const { from, to } = req.params;
    const maxHops = parseInt(req.query.maxHops) || 5;

    const path = await graphService.findShortestPath(from, to, maxHops);

    if (!path) {
      return res.json({ message: 'No path found between entities' });
    }

    res.json({ path });

  } catch (error) {
    console.error('Path finding error:', error);
    res.status(500).json({ error: 'Failed to find path' });
  }
});

/**
 * @swagger
 * /api/knowledge-graph/entities:
 *   get:
 *     summary: Get all entities with filtering
 */
router.get('/entities', async (req, res) => {
  try {
    const { type, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { aliases: { $regex: search, $options: 'i' } }
      ];
    }

    const entities = await Entity.find(query)
      .sort({ 'papers.length': -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Entity.countDocuments(query);

    res.json({
      entities,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get entities error:', error);
    res.status(500).json({ error: 'Failed to fetch entities' });
  }
});

module.exports = router;

// ================================
// SERVICES - aiService.js
// ================================

const OpenAI = require('openai');
const axios = require('axios');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class AIService {
  async extractMetadata(content) {
    try {
      const prompt = `
        Extract metadata from this scientific paper content. Return JSON format with:
        - title: string
        - authors: array of {name, affiliation}
        - abstract: string
        - keywords: array of strings
        - categories: array of strings
        
        Content:
        ${content.substring(0, 2000)}
      `;

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a scientific document analyzer. Extract metadata accurately and return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('Metadata extraction error:', error);
      return {
        title: 'Unknown Title',
        authors: [],
        abstract: content.substring(0, 500),
        keywords: [],
        categories: []
      };
    }
  }

  async analyzePaper(content) {
    try {
      const prompt = `
        Analyze this scientific paper and provide:
        1. Summary (2-3 sentences)
        2. Key findings (bullet points)
        3. Methodology overview
        4. Limitations
        5. Future work suggestions
        
        Return as JSON with fields: summary, keyFindings, methodology, limitations, futureWork
        
        Content:
        ${content.substring(0, 4000)}
      `;

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert scientific paper analyzer. Provide detailed, accurate analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('Paper analysis error:', error);
      return {
        summary: 'Analysis failed',
        keyFindings: [],
        methodology: 'Unknown',
        limitations: [],
        futureWork: []
      };
    }
  }

  async generateHypotheses(entities, relationships, context) {
    try {
      const prompt = `
        Based on the following scientific entities and their relationships, generate 3 novel research hypotheses:
        
        Entities: ${entities.map(e => `${e.name} (${e.type})`).join(', ')}
        
        Relationships: ${relationships.map(r => `${r.subject} ${r.predicate} ${r.object}`).join(', ')}
        
        Context: ${context}
        
        For each hypothesis, provide:
        - title: clear, concise title
        - description: detailed description
        - reasoning: scientific reasoning
        - testability: how it could be tested
        - novelty: why it's novel
        - impact: potential scientific impact
        
        Return as JSON array of hypothesis objects.
      `;

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a creative scientific researcher who generates novel, testable hypotheses based on existing knowledge.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      });

      const hypotheses = JSON.parse(response.choices[0].message.content);
      
      // Add confidence scores
      return hypotheses.map(h => ({
        ...h,
        confidence: this.calculateHypothesisConfidence(h),
        novelty: { score: Math.random() * 0.5 + 0.5, reasoning: h.novelty },
        impact: { score: Math.random() * 0.5 + 0.5, domains: ['biotechnology', 'medicine'] },
        testability: { score: Math.random() * 0.5 + 0.5, methods: h.testability.split(',') }
      }));

    } catch (error) {
      console.error('Hypothesis generation error:', error);
      return [];
    }
  }

  calculateHypothesisConfidence(hypothesis) {
    // Simple confidence calculation based on content quality
    let confidence = 0.5;
    
    if (hypothesis.reasoning && hypothesis.reasoning.length > 100) confidence += 0.1;
    if (hypothesis.testability && hypothesis.testability.length > 50) confidence += 0.1;
    if (hypothesis.description && hypothesis.description.length > 100) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  async findSimilarPapers(paperContent, limit = 5) {
    try {
      // This would integrate with external APIs like Semantic Scholar or arXiv
      // For now, return mock similar papers
      return [
        {
          title: "Related Research Paper 1",
          authors: ["Dr. Smith", "Dr. Johnson"],
          similarity: 0.85,
          url: "https://example.com/paper1"
        },
        {
          title: "Related Research Paper 2", 
          authors: ["Dr. Brown", "Dr. Wilson"],
          similarity: 0.78,
          url: "https://example.com/paper2"
        }
      ];

    } catch (error) {
      console.error('Similar papers search error:', error);
      return [];
    }
  }
}

module.exports = new AIService();
