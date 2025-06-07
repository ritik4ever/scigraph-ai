const natural = require('natural');
const compromise = require('compromise');

class NLPService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    
    // Bio-medical entity patterns
    this.entityPatterns = {
      PROTEIN: /\b[A-Z][a-z]*[0-9]*(?:-[A-Z]*[0-9]*)*\b/g,
      GENE: /\b[A-Z]{2,}[0-9]*\b/g,
      DISEASE: /\b(?:cancer|diabetes|alzheimer|parkinson|disease|syndrome|disorder)\b/gi,
      DRUG: /\b(?:drug|compound|inhibitor|agonist|antagonist|therapy)\b/gi
    };
  }

  async extractEntities(text) {
    try {
      const entities = [];
      const doc = compromise(text);

      // Extract using compromise.js
      const people = doc.people().out('array');
      const places = doc.places().out('array');
      const organizations = doc.organizations().out('array');

      // Add general entities
      people.forEach(person => {
        entities.push({
          text: person,
          type: 'PERSON',
          confidence: 0.8,
          positions: this.findPositions(text, person)
        });
      });

      places.forEach(place => {
        entities.push({
          text: place,
          type: 'LOCATION',
          confidence: 0.7,
          positions: this.findPositions(text, place)
        });
      });

      // Extract biomedical entities using patterns
      for (const [type, pattern] of Object.entries(this.entityPatterns)) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          entities.push({
            text: match[0],
            type: type,
            confidence: 0.6,
            positions: [{
              start: match.index,
              end: match.index + match[0].length
            }]
          });
        }
      }

      // Remove duplicates and filter by confidence
      const uniqueEntities = this.removeDuplicateEntities(entities);
      return uniqueEntities.filter(e => e.confidence >= 0.5);

    } catch (error) {
      console.error('Entity extraction error:', error);
      return [];
    }
  }

  async extractRelationships(text, entities) {
    try {
      const relationships = [];
      const sentences = text.split(/[.!?]+/);

      for (const sentence of sentences) {
        if (sentence.length < 20) continue;

        const sentenceEntities = entities.filter(entity => 
          sentence.toLowerCase().includes(entity.text.toLowerCase())
        );

        if (sentenceEntities.length < 2) continue;

        // Find relationship patterns
        for (let i = 0; i < sentenceEntities.length; i++) {
          for (let j = i + 1; j < sentenceEntities.length; j++) {
            const subject = sentenceEntities[i];
            const object = sentenceEntities[j];
            
            const predicate = this.identifyRelationship(sentence, subject.text, object.text);
            
            if (predicate) {
              relationships.push({
                subject: subject.text,
                predicate: predicate,
                object: object.text,
                confidence: 0.7,
                evidence: sentence.trim()
              });
            }
          }
        }
      }

      return relationships;

    } catch (error) {
      console.error('Relationship extraction error:', error);
      return [];
    }
  }

  identifyRelationship(sentence, subject, object) {
    const lowerSentence = sentence.toLowerCase();
    
    // Relationship patterns
    const patterns = [
      { keywords: ['interact', 'interaction', 'bind'], relation: 'INTERACTS_WITH' },
      { keywords: ['regulate', 'regulation', 'control'], relation: 'REGULATES' },
      { keywords: ['inhibit', 'suppress', 'block'], relation: 'INHIBITS' },
      { keywords: ['activate', 'stimulate', 'enhance'], relation: 'ACTIVATES' },
      { keywords: ['cause', 'lead to', 'result in'], relation: 'CAUSES' },
      { keywords: ['treat', 'therapy', 'therapeutic'], relation: 'TREATS' },
      { keywords: ['associate', 'correlation', 'link'], relation: 'ASSOCIATED_WITH' }
    ];

    for (const pattern of patterns) {
      if (pattern.keywords.some(keyword => lowerSentence.includes(keyword))) {
        return pattern.relation;
      }
    }

    return null;
  }

  findPositions(text, entity) {
    const positions = [];
    const regex = new RegExp(entity, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
      positions.push({
        start: match.index,
        end: match.index + match[0].length
      });
    }

    return positions;
  }

  removeDuplicateEntities(entities) {
    const seen = new Set();
    return entities.filter(entity => {
      const key = `${entity.text.toLowerCase()}-${entity.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async summarizeText(text, maxLength = 300) {
    try {
      const sentences = text.split(/[.!?]+/).filter(s => s.length > 20);
      
      if (sentences.length <= 3) {
        return text;
      }

      // Simple extractive summarization
      const sentenceScores = sentences.map(sentence => ({
        text: sentence.trim(),
        score: this.scoreSentence(sentence, text)
      }));

      sentenceScores.sort((a, b) => b.score - a.score);
      
      const topSentences = sentenceScores
        .slice(0, Math.ceil(sentences.length * 0.3))
        .map(s => s.text);

      return topSentences.join('. ') + '.';

    } catch (error) {
      console.error('Summarization error:', error);
      return text.substring(0, maxLength);
    }
  }

  scoreSentence(sentence, fullText) {
    const words = this.tokenizer.tokenize(sentence.toLowerCase());
    const allWords = this.tokenizer.tokenize(fullText.toLowerCase());
    
    // Calculate TF-IDF-like score
    let score = 0;
    const wordCounts = {};
    
    allWords.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    words.forEach(word => {
      const tf = (wordCounts[word] || 0) / allWords.length;
      const idf = Math.log(allWords.length / (wordCounts[word] || 1));
      score += tf * idf;
    });

    return score / words.length;
  }
}

module.exports = new NLPService();
