/**
 * Lightweight input validation middleware.
 * Validates req.body against a schema object.
 * Schema format: { fieldName: { type: 'string'|'number'|'array'|'boolean', required: boolean, min: number, max: number, enum: [] } }
 */
const validate = (schema) => (req, res, next) => {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip validation if field is optional and not provided
    if (value === undefined || value === null) continue;

    // Type checking
    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push(`${field} must be a string`);
    } else if (rules.type === 'number' && typeof value !== 'number') {
      errors.push(`${field} must be a number`);
    } else if (rules.type === 'array' && !Array.isArray(value)) {
      errors.push(`${field} must be an array`);
    } else if (rules.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`${field} must be a boolean`);
    }

    // String length limits
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.min && value.length < rules.min) {
        errors.push(`${field} must be at least ${rules.min} characters`);
      }
      if (rules.max && value.length > rules.max) {
        errors.push(`${field} must be at most ${rules.max} characters`);
      }
    }

    // Number range
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must be at most ${rules.max}`);
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join('; ') });
  }

  next();
};

module.exports = validate;
