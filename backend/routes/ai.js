import express from 'express';
import { generateWorkflowFromNaturalLanguage } from '../ai.js';

const router = express.Router();

// POST /api/ai/parse-workflow
router.post('/parse-workflow', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Prompt text is required to generate a workflow.'
      });
    }

    const workflowDraft = await generateWorkflowFromNaturalLanguage(prompt);

    res.json({
      success: true,
      data: workflowDraft
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: `Failed to compile workflow: ${err.message}`
    });
  }
});

export default router;
