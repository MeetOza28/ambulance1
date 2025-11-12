// import express from "express";
// import multer from "multer";
// import path from "path";
// import { fileURLToPath } from "url";
// import { protect } from "../middlewares/authMiddleware.js";
// import { createViolation, listViolations } from "../controllers/violationController.js";

// const router = express.Router();
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const uploadDir = path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
//   }
// });

// const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// router.post("/upload", protect, upload.single("image"), createViolation);
// router.get("/", protect, listViolations);

// export default router;


// routes/helmetRoutes.js
import express from 'express';
import Violation from '../models/Violation.js';
import { getHelmetStats } from '../controllers/violationController.js';
// import other helmet/violation controllers if you have them
const router = express.Router();

// // GET all violations
// router.get('/', async (req, res) => {
//   try {
//     const violations = await Violation.find();  // fetch all
//     res.json(violations);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// routes/helmetRoutes.js (replace the existing GET / handler with this)
router.get('/', async (req, res) => {
  try {
    // fetch raw docs from DB and force plain JS objects so fields are visible
    const docs = await Violation.find({}).lean().exec();

    // LOG first few docs server-side so you can inspect exactly what the API returns
    console.log('GET /api/violation -> first doc (server):', docs && docs.length ? docs[0] : 'NO_DOCS');

    // if documents are stored using snake_case or different names, we can map them here
    const normalized = docs.map(d => {
      // prefer existing structure, but pick many possible field names for robustness
      const location = d.location ?? d.location_name ?? d.loc ?? (d.coords ? { name: d.coords.name, coords: d.coords } : null);

      return {
        _id: d._id,
        violationId: d.violationId ?? d.violation_id ?? d.violationId,
        vehicleNumber: d.vehicleNumber ?? d.number_plate ?? d.vehicle_number ?? d.numberPlate ?? '',
        location, // keep nested object if present (name + coords)
        time: d.time ?? d.timestamp ?? d.createdAt ?? d.timeStamp ?? null,
        fineAmount: d.fineAmount ?? d.fine_amount ?? d.fine ?? 0,
        imageUrl: d.imageUrl ?? d.image_path ?? d.image ?? '',
        challanNumber: d.challanNumber ?? d.challan_number ?? d.challan ?? '',
        raw: d
      };
    });

    // return the normalized array so client always sees `location` when present in DB
    return res.json(normalized);
  } catch (err) {
    console.error('GET /api/violation error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


// export default router;
router.get('/stats', getHelmetStats);

// add other helmet/violation routes e.g. router.post('/create', createViolation)...

export default router;
