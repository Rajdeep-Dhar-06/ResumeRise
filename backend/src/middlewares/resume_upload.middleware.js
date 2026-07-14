import multer from 'multer';

/**
 * Multer multipart file upload middleware configuration.
 * Configures transient memory storage and limits uploaded files to a maximum of 3 MB.
 * Suitable for parsing resume PDF documents in-memory.
 * 
 * @type {import('multer').Multer}
 */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024, // 3 MB limit
    },
});

export default upload;
