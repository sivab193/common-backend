export const isString = (val) => typeof val === 'string' && val.trim().length > 0;

export const isArrayOfStrings = (arr) => Array.isArray(arr) && arr.every(item => isString(item));

export const isBoolean = (val) => typeof val === 'boolean';

export const normalizeString = (val) => isString(val) ? val.trim() : null;

export const normalizeArray = (arr) => isArrayOfStrings(arr) ? arr.map(item => item.trim()) : [];

export const validateProjectInput = (data) => {
    const errors = [];

    if (!isString(data.title)) errors.push('Title is required and must be a string');
    if (!isString(data.description)) errors.push('Description is required and must be a string');
    if (!isArrayOfStrings(data.technologies)) errors.push('Technologies is required and must be an array of strings');
    if (data.github !== undefined && data.github !== null && !isString(data.github)) errors.push('Github must be a string or null');
    if (data.demo !== undefined && data.demo !== null && !isString(data.demo)) errors.push('Demo must be a string or null');
    if (data.highlights !== undefined && !isArrayOfStrings(data.highlights)) errors.push('Highlights must be an array of strings');
    if (data.visible !== undefined && !isBoolean(data.visible)) errors.push('Visible must be a boolean');

    return errors;
};
