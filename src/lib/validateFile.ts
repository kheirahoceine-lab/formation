const MB = 1024 * 1024;

export function validateImage(file: File) {
  if (file.size > 5 * MB) return "الصورة كبيرة بزاف (الحد الأقصى 5 ميغا).";
  if (!file.type.startsWith("image/")) return "خاص يكون ملف صورة.";
  return null;
}

export function validateLessonFile(file: File) {
  if (file.size > 25 * MB) return "الملف كبير بزاف (الحد الأقصى 25 ميغا).";
  return null;
}

export function safeFileName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_").slice(-100);
}
