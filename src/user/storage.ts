import { diskStorage } from 'multer';
import path = require('path');

const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];

export const storageConfig = {
  storage: diskStorage({
    destination: './uploads/profileimages',
    filename: (req, file, cb) => {
      const filename: string =
        path.parse(file.originalname).name.replace(/\s/g, '') +
        new Date().toISOString();
      const exstension: string = path.parse(file.originalname).ext;

      cb(null, `${filename}${exstension}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = validMimeTypes;
    allowedMimeTypes.includes(file.mimetype) ? cb(null, true) : cb(null, false);
  },
};
