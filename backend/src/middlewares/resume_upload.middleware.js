import multer from 'multer';

/**
 * Multer multipart file upload middleware configuration.
 * Configures transient memory storage and limits uploaded files to a maximum of 3 MB.
 * Suitable for parsing resume PDF documents in-memory.
 */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024, // 3 MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed.'), false);
        }
    },
});

export default upload;
