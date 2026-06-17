const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const bucketName = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!bucketName) {
  throw new Error('AWS_S3_BUCKET or AWS_BUCKET_NAME is required for S3 uploads');
}

const hasPlaceholderAwsCredentials =
  accessKeyId === 'your_aws_access_key' ||
  secretAccessKey === 'your_aws_secret_key';

const cleanPrefix = (value, fallback) => {
  const prefix = value || fallback;
  return prefix.replace(/^\/+/, '').replace(/\/?$/, '/');
};

const safeFileName = (fileName) => fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
const isLocalDev = process.env.NODE_ENV !== 'production';
const shouldUseLocalStorage = isLocalDev && hasPlaceholderAwsCredentials;

const s3 = new S3Client({ region });
const localCourseVideoDir = path.join(__dirname, '..', 'public', 'course-videos');

const localCourseVideoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(localCourseVideoDir, { recursive: true });
    cb(null, localCourseVideoDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${safeFileName(file.originalname)}`);
  }
});

const localCourseVideoMiddleware = multer({
  storage: localCourseVideoStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

const s3CourseVideoMiddleware = multer({
  storage: multerS3({
    s3,
    bucket: bucketName,
    metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
    key: (req, file, cb) => {
      const prefix = cleanPrefix(process.env.S3_COURSE_VIDEOS_PREFIX, 'course-videos');
      cb(null, `${prefix}${Date.now()}-${safeFileName(file.originalname)}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    contentDisposition: (req, file, cb) => cb(null, 'inline')
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

const uploadCourseVideo = shouldUseLocalStorage
  ? {
      single(fieldName) {
        const middleware = localCourseVideoMiddleware.single(fieldName);

        return (req, res, next) => {
          middleware(req, res, (err) => {
            if (err) {
              next(err);
              return;
            }

            if (req.file) {
              req.file.location = `/public/course-videos/${req.file.filename}`;
            }

            next();
          });
        };
      }
    }
  : s3CourseVideoMiddleware;

module.exports = {
  uploadCourseVideo
};
