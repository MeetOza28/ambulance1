// const multer = require('multer');
// const path = require('path');
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, 'uploads/'),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, Date.now() + '-' + Math.round(Math.random()*1E9) + ext);
//   }
// });
// const fileFilter = (req, file, cb) => {
//   if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'), false);
//   cb(null, true);
// };
// const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// module.exports = upload;
