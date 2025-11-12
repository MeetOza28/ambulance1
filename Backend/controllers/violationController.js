// const Violation = require('../models/Violation');
// const csvStringify = require('csv-stringify/lib/sync'); // optional for CSV export

// // Create a new violation (multipart with image)
// exports.createViolation = async (req, res, next) => {
//   try {
//     const {
//       violationId,
//       vehicleNumber,
//       vehicleType,
//       locationName,
//       lat,
//       lng,
//       time,
//       fineAmount,
//       status,
//       severity,
//       notes
//     } = req.body;

//     const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

//     const v = new Violation({
//       violationId,
//       vehicleNumber,
//       vehicleType,
//       location: { name: locationName, coords: lat && lng ? { lat, lng } : undefined },
//       time: time ? new Date(time) : new Date(),
//       fineAmount,
//       status,
//       severity,
//       notes,
//       imageUrl,
//       officerId: req.user?.id // if auth middleware sets req.user
//     });

//     await v.save();

//     // If you have socket.io instance attached to req.app
//     if (req.app && req.app.get('io')) {
//       req.app.get('io').emit('violation:created', v);
//     }

//     res.status(201).json(v);
//   } catch (err) {
//     next(err);
//   }
// };

// // List violations with pagination, search, filter
// exports.listViolations = async (req, res, next) => {
//   try {
//     const { page = 1, limit = 10, search, status, severity, sortBy = '-time' } = req.query;
//     const filter = {};
//     if (search) {
//       const s = new RegExp(search, 'i');
//       filter.$or = [{ vehicleNumber: s }, { 'location.name': s }, { violationId: s }];
//     }
//     if (status) filter.status = status;
//     if (severity) filter.severity = severity;

//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     const total = await Violation.countDocuments(filter);
//     const items = await Violation.find(filter)
//       .sort(sortBy)
//       .skip(skip)
//       .limit(parseInt(limit));

//     res.json({ total, page: parseInt(page), limit: parseInt(limit), items });
//   } catch (err) {
//     next(err);
//   }
// };

// exports.getViolation = async (req, res, next) => {
//   try {
//     const v = await Violation.findById(req.params.id);
//     if (!v) return res.status(404).json({ message: 'Not found' });
//     res.json(v);
//   } catch (err) { next(err); }
// };

// exports.updateViolation = async (req, res, next) => {
//   try {
//     const updates = req.body;
//     if (req.file) updates.imageUrl = `/uploads/${req.file.filename}`;

//     const v = await Violation.findByIdAndUpdate(req.params.id, updates, { new: true });
//     if (!v) return res.status(404).json({ message: 'Not found' });

//     res.json(v);
//   } catch (err) { next(err); }
// };

// exports.deleteViolation = async (req, res, next) => {
//   try {
//     const v = await Violation.findByIdAndDelete(req.params.id);
//     if (!v) return res.status(404).json({ message: 'Not found' });
//     res.json({ message: 'Deleted' });
//   } catch (err) { next(err); }
// };

// // Stats for dashboard cards
// exports.getStats = async (req, res, next) => {
//   try {
//     // total today, pending actions, resolved today, fine collected today
//     const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
//     const endOfToday = new Date(); endOfToday.setHours(23,59,59,999);

//     const totalToday = await Violation.countDocuments({ time: { $gte: startOfToday, $lte: endOfToday }});
//     const pendingActions = await Violation.countDocuments({ status: 'Pending' });
//     const resolvedToday = await Violation.countDocuments({ status: 'Resolved', time: { $gte: startOfToday, $lte: endOfToday }});
//     const fines = await Violation.aggregate([
//       { $match: { time: { $gte: startOfToday, $lte: endOfToday } } },
//       { $group: { _id: null, total: { $sum: '$fineAmount' } } }
//     ]);

//     const fineCollected = fines[0]?.total || 0;

//     res.json({ totalToday, pendingActions, resolvedToday, fineCollected });
//   } catch (err) { next(err); }
// };

// // Export CSV
// exports.exportCSV = async (req, res, next) => {
//   try {
//     const items = await Violation.find({}).lean();
//     const columns = ['violationId','vehicleNumber','vehicleType','location.name','time','fineAmount','status','severity','imageUrl'];
//     const data = items.map(it => ([
//       it.violationId,
//       it.vehicleNumber,
//       it.vehicleType,
//       it.location?.name || '',
//       it.time ? it.time.toISOString() : '',
//       it.fineAmount,
//       it.status,
//       it.severity,
//       it.imageUrl || ''
//     ]));
//     const csv = csvStringify(data, { header: true, columns });
//     res.setHeader('Content-Type', 'text/csv');
//     res.setHeader('Content-Disposition', 'attachment; filename=violations.csv');
//     res.send(csv);
//   } catch (err) { next(err); }
// };


// // controllers/helmetController.js
// import Violation from '../models/Violation.js'; // adjust path to your model

// export const getHelmetStats = async (req, res) => {
//   try {
//     // total number of helmet violations and optionally totalFine/revenue for these
//     const all = await Violation.find();
//     const totalViolations = Array.isArray(all) ? all.length : 0;

//     // compute total fine (if you store fineAmount as number or string)
//     let totalFine = 0;
//     all.forEach(v => {
//       const raw = v.fineAmount ?? v.fine ?? 0;
//       const n = Number(String(raw).replace(/[^\d.-]/g, '')) || 0;
//       totalFine += n;
//     });

//     res.status(200).json({
//       totalViolations,
//       totalFine
//     });
//   } catch (err) {
//     console.error('getHelmetStats error', err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };


// // controllers/helmetController.js
// import Violation from '../models/Violation.js'; // adjust path

// export const getHelmetStats = async (req, res) => {
//   try {
//     if (!Violation || typeof Violation.find !== 'function') {
//       console.warn('Violation model missing or invalid');
//       return res.status(200).json({ totalViolations: 0, totalFine: 0 });
//     }

//     const all = await Violation.find().lean().catch(err => {
//       console.error('Violation.find() failed:', err);
//       return [];
//     });

//     const totalViolations = Array.isArray(all) ? all.length : 0;
//     let totalFine = 0;
//     if (Array.isArray(all)) {
//       all.forEach(v => {
//         const raw = v.fineAmount ?? v.fine ?? v.amount ?? 0;
//         const n = Number(String(raw).replace(/[^\d.-]/g, '')) || 0;
//         totalFine += n;
//       });
//     }

//     return res.status(200).json({ totalViolations, totalFine });
//   } catch (err) {
//     console.error('getHelmetStats error:', err);
//     return res.status(200).json({ totalViolations: 0, totalFine: 0 });
//   }
// };

// controllers/violationController.js
import Violation from '../models/Violation.js';

export const getHelmetStats = async (req, res) => {
  try {
    if (!Violation || typeof Violation.find !== 'function') {
      return res.status(200).json({ totalViolations: 0, totalFine: 0, revenue: 0 });
    }

    const all = await Violation.find().lean().catch(err => {
      console.error('Violation.find() failed:', err);
      return [];
    });

    const totalViolations = Array.isArray(all) ? all.length : 0;

    let totalFine = 0;
    if (Array.isArray(all)) {
      all.forEach(v => {
        // accept many field names and strip non numeric chars
        const raw = v.fine_amount ?? v.fineAmount ?? v.fine ?? v.amount ?? 0;
        const n = Number(String(raw).replace(/[^\d.-]/g, '')) || 0;
        totalFine += n;
      });
    }

    // Return consistent keys: totalFine AND revenue (both numeric)
    return res.status(200).json({ totalViolations, totalFine, revenue: totalFine });
  } catch (err) {
    console.error('getHelmetStats error:', err);
    return res.status(200).json({ totalViolations: 0, totalFine: 0, revenue: 0 });
  }
};
