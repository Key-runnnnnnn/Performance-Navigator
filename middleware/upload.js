const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const fileFilter = (req, file, cb) => {
    if (path.extname(file.originalname) === '.json') cb(null, true);
    else cb(new Error('Only JSON files allowed'), false);
};

// Export the configured multer instance
module.exports = multer({ storage, fileFilter });