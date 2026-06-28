export function parseLocalDate(dateString) {
  if (!dateString) return new Date();
  if (dateString.includes('T')) {
    return new Date(dateString);
  }
  return new Date(dateString + 'T00:00:00');
}
