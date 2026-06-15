export const getEntityId = (value) => {
  if (value == null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  const nestedId = value.id ?? value._id ?? value.$oid;

  if (nestedId != null && nestedId !== value) {
    return getEntityId(nestedId);
  }

  if (
    typeof value.toString === "function" &&
    value.toString !== Object.prototype.toString
  ) {
    const stringValue = value.toString();
    return stringValue === "[object Object]" ? "" : stringValue;
  }

  return "";
};
