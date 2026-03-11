import axios from 'axios';
import OpenAI from 'openai';
import logger from '../../utils/logger.js';
import { analyzeAirdropText } from './openrouter.js';

// Ollama client (local)
const ollamaClient = axios.create({
  baseURL: process.env.OLLAMA_HOST || 'http://localhost:11434',
  timeout: 30000
});

// OpenRouter client (cloud - free tier)
const openrouterClient = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'sk-or-v1-dummy',
  defaultHeaders: {
    'HTTP-Referer': 'https://github.com/Acarlosr/airdrop-tracker',
    'X-Title': 'Airdrop Tracker'
  }
});

// Groq client (fast inference - free tier)
const groqClient = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || 'gsk_dummy'
});

// AI Provider Strategy
class AIService {
  constructor() {
    this.useOllama = process.env.USE_OLLAMA === 'true';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';
    this.openrouterModel = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';
    this.groqModel = process.env.GROQ_MODEL || 'llama-3-8b-8192';
  }

  /**
   * Analyze text with AI
   * Strategy: Ollama for batch, Groq for real-time, OpenRouter as fallback
   */
  async analyze(text, options = {}) {
    const { mode = 'batch', systemPrompt = '', temperature = 0.7 } = options;

    try {
      // Use Groq for real-time/urgent analysis (fastest)
      if (mode === 'realtime' || mode === 'urgent') {
        return await this.analyzeWithGroq(text, systemPrompt, temperature);
      }

      // Use Ollama for batch processing (free, local)
      if (this.useOllama && mode === 'batch') {
        return await this.analyzeWithOllama(text, systemPrompt, temperature);
      }

      // Fallback to OpenRouter
      return await this.analyzeWithOpenRouter(text, systemPrompt, temperature);

    } catch (err) {
      logger.error('AI analysis error:', err.message);

      // Fallback chain: Ollama -> OpenRouter -> Groq
      if (this.useOllama && mode !== 'batch') {
        try {
          return await this.analyzeWithOllama(text, systemPrompt, temperature);
        } catch (ollamaErr) {
          logger.warn('Ollama fallback failed, trying OpenRouter');
        }
      }

      if (mode !== 'realtime') {
        try {
          return await this.analyzeWithOpenRouter(text, systemPrompt, temperature);
        } catch (openrouterErr) {
          logger.warn('OpenRouter fallback failed, trying Groq');
        }
      }

      return await this.analyzeWithGroq(text, systemPrompt, temperature);
    }
  }

  async analyzeWithOllama(text, systemPrompt, temperature) {
    logger.debug('Using Ollama for analysis');

    const response = await ollamaClient.post('/api/generate', {
      model: this.ollamaModel,
      prompt: `${systemPrompt}\n\n${text}`,
      stream: false,
      options: {
        temperature
      }
    });

    return response.data.response;
  }

  async analyzeWithOpenRouter(text, systemPrompt, temperature) {
    logger.debug('Using OpenRouter for analysis');

    const response = await openrouterClient.chat.completions.create({
      model: this.openrouterModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature
    });

    return response.choices[0].message.content;
  }

  async analyzeWithGroq(text, systemPrompt, temperature) {
    logger.debug('Using Groq for analysis');

    const response = await groqClient.chat.completions.create({
      model: this.groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature
    });

    return response.choices[0].message.content;
  }

  /**
   * Analyze social media post for airdrop information
   */
  async analyzeSocialPost(post) {
    const systemPrompt = `You are an expert at analyzing crypto social media posts to identify airdrop announcements.

Analyze the following post and extract:
1. Is this an airdrop announcement? (true/false)
2. Urgency level (critical/high/normal/low)
3. Protocol/Project name
4. Blockchain/Chain
5. Eligibility criteria
6. Snapshot date (if mentioned)
7. Claim dates (if mentioned)
8. Key actions required

Respond in JSON format only.`;

    const response = await this.analyze(post.content, {
      mode: post.urgent ? 'realtime' : 'batch',
      systemPrompt,
      temperature: 0.3 // Lower temperature for structured extraction
    });

    try {
      return JSON.parse(response);
    } catch (err) {
      logger.error('Failed to parse AI response:', response);
      return {
        is_airdrop: false,
        urgency: 'low',
        error: 'Failed to parse response'
      };
    }
  }

  /**
   * Classify urgency of an alert
   */
  async classifyUrgency(message) {
    const systemPrompt = `Classify the urgency of this crypto/airdrop message.
Return only one word: critical, high, normal, or low.

Critical: Snapshot happening today, claim deadline today
High: Snapshot this week, important eligibility action needed
Normal: General announcements, upcoming events
Low: Info, discussions, non-urgent updates`;

    const response = await this.analyze(message, {
      mode: 'realtime',
      systemPrompt,
      temperature: 0.1
    });

    return response.trim().toLowerCase();
  }

  /**
   * Extract structured data from text
   */
  async extractStructuredData(text, schema) {
    const systemPrompt = `Extract information from the text according to this schema:
${JSON.stringify(schema, null, 2)}

Respond with JSON only, following the exact schema structure.`;

    const response = await this.analyze(text, {
      mode: 'batch',
      systemPrompt,
      temperature: 0.2
    });

    try {
      return JSON.parse(response);
    } catch (err) {
      logger.error('Failed to extract structured data');
      return null;
    }
  }
}

export { analyzeAirdropText };
export default new AIService();
