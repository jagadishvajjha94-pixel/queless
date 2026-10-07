const Token = require('../models/Token');
const Service = require('../models/Service');
const Business = require('../models/Business');
const axios = require('axios');

const FASTAPI_URL = process.env.FASTAPI_SERVICE_URL || 'http://127.0.0.1:8000';

// @desc    Get dashboard analytics for a business
// @route   GET /api/analytics/:businessId
// @access  Private (Business Owner / Admin)
exports.getBusinessAnalytics = async (req, res, next) => {
  try {
    const { businessId } = req.params;

    // Verify ownership
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view analytics for this business' });
    }

    // Retrieve all tokens for this business from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tokens = await Token.find({
      business: businessId,
      joinedAt: { $gte: thirtyDaysAgo }
    }).populate('service', 'name');

    // If there are no tokens, return empty analytics immediately without hitting FastAPI
    if (tokens.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          total_customers: 0,
          completed_count: 0,
          cancelled_count: 0,
          skipped_count: 0,
          average_waiting_time: 0,
          popular_services: [],
          peak_hours: []
        }
      });
    }

    // Format tokens data for the Python service
    const formattedTokens = tokens.map(t => ({
      joined_at: t.joinedAt ? t.joinedAt.toISOString() : null,
      called_at: t.calledAt ? t.calledAt.toISOString() : null,
      completed_at: t.completedAt ? t.completedAt.toISOString() : null,
      service_name: t.service ? t.service.name : 'Unknown Service',
      status: t.status
    }));

    // Post to Python service for analysis
    let analyticsData;
    try {
      const response = await axios.post(`${FASTAPI_URL}/api/analytics`, {
        tokens: formattedTokens
      });
      analyticsData = response.data;
    } catch (apiErr) {
      console.warn('FastAPI analytics service error, running fallback javascript aggregation', apiErr.message);
      
      // Fallback Javascript analytics calculation
      let totalCompleted = 0;
      let totalWaitingTime = 0;
      let cancelled = 0;
      let skipped = 0;
      const svcMap = {};
      const hourMap = {};

      formattedTokens.forEach(t => {
        if (t.status === 'completed') {
          totalCompleted++;
          if (t.joined_at && t.completed_at) {
            const wait = (new Date(t.completed_at) - new Date(t.joined_at)) / (60 * 1000); // minutes
            totalWaitingTime += wait;
          }
        } else if (t.status === 'cancelled') {
          cancelled++;
        } else if (t.status === 'skipped') {
          skipped++;
        }

        // Service popularity
        svcMap[t.service_name] = (svcMap[t.service_name] || 0) + 1;

        // Peak Hours
        if (t.joined_at) {
          const hour = new Date(t.joined_at).getHours();
          hourMap[hour] = (hourMap[hour] || 0) + 1;
        }
      });

      const avgWait = totalCompleted > 0 ? Math.round(totalWaitingTime / totalCompleted) : 0;
      
      const popular_services = Object.keys(svcMap).map(name => ({
        name,
        count: svcMap[name]
      })).sort((a, b) => b.count - a.count).slice(0, 5);

      const peak_hours = Object.keys(hourMap).map(hour => ({
        hour: parseInt(hour),
        count: hourMap[hour]
      })).sort((a, b) => a.hour - b.hour);

      analyticsData = {
        total_customers: formattedTokens.length,
        completed_count: totalCompleted,
        cancelled_count: cancelled,
        skipped_count: skipped,
        average_waiting_time: avgWait,
        popular_services,
        peak_hours
      };
    }

    res.status(200).json({
      success: true,
      data: analyticsData
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get global stats for Super Admin
// @route   GET /api/admin/stats
// @access  Private (Admin Only)
exports.getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await Token.db.model('User').countDocuments();
    const totalBusinesses = await Business.countDocuments();
    const totalTokens = await Token.countDocuments();
    
    // Aggregation for category statistics
    const categoriesStats = await Business.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } }
    ]);

    const activeTokensCount = await Token.countDocuments({ status: { $in: ['waiting', 'called'] } });
    const completedTokensCount = await Token.countDocuments({ status: 'completed' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalBusinesses,
        totalTokens,
        categoriesStats,
        activeTokensCount,
        completedTokensCount
      }
    });
  } catch (err) {
    next(err);
  }
};
