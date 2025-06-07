const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Paper = require('../models/Paper');
const aiService = require('../services/aiService');
const nlpService = require('../services/nlpService');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/json'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

/**
 * @swagger
 * /api/papers/upload:
 *   post:
 *     summary: Upload and analyze a scientific paper
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: paper
 *         type: file
 *         required: true
 *         description: PDF or text file of the scientific paper
 *     responses:
 *       201:
 *         description: Paper uploaded and analysis started
 *       400:
 *         description: Invalid file or data
 */
router.post('/upload', upload.single('paper'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let content = '';
    
    // Extract text based on file type
    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(req.file.buffer);
      content = pdfData.text;
    } else if (req.file.mimetype === 'text/plain') {
      content = req.file.buffer.toString('utf8');
    } else if (req.file.mimetype === 'application/json') {
      const jsonData = JSON.parse(req.file.buffer.toString('utf8'));
      content = jsonData.content || jsonData.abstract || '';
    }

    if (!content.trim()) {
      return res.status(400).json({ error: 'Could not extract text from file' });
    }

    // Extract basic metadata using AI
    const metadata = await aiService.extractMetadata(content);
    
    // Create paper document
    const paper = new Paper({
      title: metadata.title || req.file.originalname,
      authors: metadata.authors || [],
      abstract: metadata.abstract || content.substring(0, 500),
      content: content,
      keywords: metadata.keywords || [],
      categories: metadata.categories || [],
      uploadedBy: req.ip,
      processingStatus: 'PROCESSING'
    });

    await paper.save();

    // Start background analysis
    processAnalysis(paper._id, content);

    res.status(201).json({
      message: 'Paper uploaded successfully',
      paperId: paper._id,
      status: 'processing'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload paper' });
  }
});

/**
 * @swagger
 * /api/papers:
 *   get:
 *     summary: Get all papers with pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const skip = (page - 1) * limit;

    let query = { isPublic: true };
    
    if (search) {
      query.$text = { $search: search };
    }

    const papers = await Paper.find(query)
      .select('title authors abstract publishedDate categories processingStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Paper.countDocuments(query);

    res.json({
      papers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get papers error:', error);
    res.status(500).json({ error: 'Failed to fetch papers' });
  }
});

/**
 * @swagger
 * /api/papers/{id}:
 *   get:
 *     summary: Get a specific paper by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id)
      .populate('citations.paperId', 'title authors')
      .lean();

    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    res.json(paper);

  } catch (error) {
    console.error('Get paper error:', error);
    res.status(500).json({ error: 'Failed to fetch paper' });
  }
});

/**
 * @swagger
 * /api/papers/{id}/analyze:
 *   post:
 *     summary: Re-analyze a paper
 */
router.post('/:id/analyze', async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    paper.processingStatus = 'PROCESSING';
    await paper.save();

    // Start background analysis
    processAnalysis(paper._id, paper.content);

    res.json({ message: 'Analysis started', status: 'processing' });

  } catch (error) {
    console.error('Analyze paper error:', error);
    res.status(500).json({ error: 'Failed to start analysis' });
  }
});

// Background analysis function
async function processAnalysis(paperId, content) {
  try {
    const paper = await Paper.findById(paperId);
    
    // Extract entities
    const entities = await nlpService.extractEntities(content);
    paper.extractedEntities = entities;

    // Find relationships
    const relationships = await nlpService.extractRelationships(content, entities);
    paper.relationships = relationships;

    // Generate analysis results
    const analysisResults = await aiService.analyzePaper(content);
    paper.analysisResults = analysisResults;

    paper.processingStatus = 'ANALYZED';
    await paper.save();

    console.log(`Analysis completed for paper ${paperId}`);

  } catch (error) {
    console.error(`Analysis failed for paper ${paperId}:`, error);
    await Paper.findByIdAndUpdate(paperId, { processingStatus: 'FAILED' });
  }
}

module.exports = router;