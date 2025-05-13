import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

export function checkRequiredFields(data, requiredFields) {
  const errors = {};
  requiredFields.forEach(field => {
    if (!data[field]?.toString().trim()) {
      const label = field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      errors[field] = `${label} is required.`;
    }
  });
  return errors;
}

export function getDataFromToken(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    console.log('Verified: 2', decodedToken);
    return decodedToken;
  } catch (err) {
    console.error('Token verification failed: 2', err.message);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export const getUrlBasedOnFileType = fileType => {
  switch (fileType) {
    case 'image/png':
      return;
    case 'application/pdf':
      return '.pdf';
    case 'application/msword':
      return '.doc';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '.docx';
    default:
      return;
  }
};

export function buildData(keys, formData, additionalFields = {}) {
  const data = {};

  keys.forEach(key => {
    const value = formData.get(key);
    if (value !== null && value !== '') {
      data[key] = value;
    }
  });

  Object.entries(additionalFields).forEach(([key, value]) => {
    if (value !== null && value !== '') {
      data[key] = value;
    }
  });

  return data;
}

export const getSizeInMB = file => {
  return file.size / (1024 * 1024);
};
