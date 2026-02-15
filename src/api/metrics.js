/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║          RINDELL MVP - METRICS ROUTES                     ║
 * ╚═══════════════════════════════════════════════════════════╝
 * 
 * API endpoints for success metrics testing
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const queueService = require('../services/queue');
const config = require('../config');

/**
 * GET /api/metrics/system
 * Get system-wide metrics
 */
router.get('/system', async (req, res) => {
  try {
    // Processing time metrics
    const processingMetrics = await db.query(`
      SELECT 
        AVG(metric_value) as avg_processing_time,
        MIN(metric_value) as min_processing_time,
        MAX(metric_value) as max_processing_time,
        COUNT(*) as total_processed,
        COUNT(CASE WHEN metric_value <= $1 THEN 1 END) as within_target
      FROM system_metrics
      WHERE metric_type = 'processing_time'
        AND (metadata->>'success')::boolean = true
    `, [config.metrics.maxProcessingTime]);

    const processingStats = processingMetrics.rows[0];
    const complianceRate = processingStats.total_processed > 0
      ? (processingStats.within_target / processingStats.total_processed) * 100
      : 0;

    // Document status counts
    const statusMetrics = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM documents
      GROUP BY status
    `);

    // Detection accuracy (would need to track true positives/negatives)
    const detectionMetrics = await db.query(`
      SELECT 
        AVG(metric_value) as detection_accuracy,
        COUNT(*) as total_detections
      FROM system_metrics
      WHERE metric_type = 'detection_accuracy'
    `);

    // Queue stats
    const queueStats = await queueService.getStats();

    res.json({
      success: true,
      metrics: {
        processing: {
          avgTime: Math.round(processingStats.avg_processing_time) || 0,
          minTime: Math.round(processingStats.min_processing_time) || 0,
          maxTime: Math.round(processingStats.max_processing_time) || 0,
          totalProcessed: parseInt(processingStats.total_processed) || 0,
          withinTarget: parseInt(processingStats.within_target) || 0,
          complianceRate: complianceRate.toFixed(2) + '%',
          target: config.metrics.maxProcessingTime + 'ms',
        },
        detection: {
          accuracy: detectionMetrics.rows[0]?.detection_accuracy || 0,
          totalDetections: parseInt(detectionMetrics.rows[0]?.total_detections) || 0,
          target: (config.metrics.minDetectionAccuracy * 100) + '%',
        },
        documents: {
          byStatus: statusMetrics.rows.reduce((acc, row) => {
            acc[row.status] = parseInt(row.count);
            return acc;
          }, {}),
        },
        queue: queueStats,
      },
      requirements: {
        maxProcessingTime: config.metrics.maxProcessingTime,
        minDetectionAccuracy: config.metrics.minDetectionAccuracy,
        queueAsync: config.metrics.requiredQueueAsync,
        sessionPersistence: config.metrics.requiredSessionPersistence,
      },
    });

  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ error: 'Failed to get metrics', message: error.message });
  }
});

/**
 * GET /api/metrics/processing-times
 * Get detailed processing time data
 */
router.get('/processing-times', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const result = await db.query(`
      SELECT 
        metric_value as processing_time,
        metadata,
        recorded_at
      FROM system_metrics
      WHERE metric_type = 'processing_time'
      ORDER BY recorded_at DESC
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      processingTimes: result.rows.map(row => ({
        time: Math.round(row.processing_time),
        documentId: row.metadata.documentId,
        filename: row.metadata.filename,
        fileType: row.metadata.fileType,
        textLength: row.metadata.textLength,
        success: row.metadata.success,
        meetsTarget: row.processing_time <= config.metrics.maxProcessingTime,
        recordedAt: row.recorded_at,
      })),
      target: config.metrics.maxProcessingTime,
    });

  } catch (error) {
    console.error('Get processing times error:', error);
    res.status(500).json({ error: 'Failed to get processing times', message: error.message });
  }
});

/**
 * GET /api/metrics/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    // Check database
    await db.query('SELECT 1');
    
    // Check queue
    const queueConnected = queueService.isConnected;

    res.json({
      success: true,
      status: 'healthy',
      services: {
        database: 'connected',
        queue: queueConnected ? 'connected' : 'disconnected',
        api: 'running',
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
});

module.exports = router;
