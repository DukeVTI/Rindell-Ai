/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║          RINDELL MVP - DOCUMENT ROUTES                    ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const express = require('express');
const router = express.Router();
const db = require('../database');

/**
 * GET /api/documents/:userId
 * Get all documents for a user
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user access (should match authenticated user)
    if (req.user && req.user.userId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(`
      SELECT 
        d.*,
        s.title,
        s.tldr,
        s.sent_to_whatsapp
      FROM documents d
      LEFT JOIN summaries s ON d.id = s.document_id
      WHERE d.user_id = $1
      ORDER BY d.uploaded_at DESC
      LIMIT 100
    `, [userId]);

    res.json({
      success: true,
      documents: result.rows,
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents', message: error.message });
  }
});

/**
 * GET /api/documents/:userId/:documentId
 * Get specific document with full summary
 */
router.get('/:userId/:documentId', async (req, res) => {
  try {
    const { userId, documentId } = req.params;

    // Verify user access
    if (req.user && req.user.userId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const docResult = await db.query(`
      SELECT * FROM documents WHERE id = $1 AND user_id = $2
    `, [documentId, userId]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const summaryResult = await db.query(`
      SELECT * FROM summaries WHERE document_id = $1
    `, [documentId]);

    const metricsResult = await db.query(`
      SELECT * FROM processing_metrics WHERE document_id = $1 ORDER BY started_at
    `, [documentId]);

    res.json({
      success: true,
      document: docResult.rows[0],
      summary: summaryResult.rows[0] || null,
      metrics: metricsResult.rows,
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to get document', message: error.message });
  }
});

/**
 * GET /api/documents/:userId/stats
 * Get processing statistics for user
 */
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user access
    if (req.user && req.user.userId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(`
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        AVG(CASE WHEN processing_duration IS NOT NULL THEN processing_duration END) as avg_processing_time
      FROM documents
      WHERE user_id = $1
    `, [userId]);

    res.json({
      success: true,
      stats: result.rows[0],
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats', message: error.message });
  }
});

module.exports = router;
