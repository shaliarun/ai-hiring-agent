import mammoth from "mammoth";
import * as XLSX from "xlsx";

export interface ParsedResumeData {
  text: string;
  name: string;
  email: string;
  phone: string;
  fileName: string;
}

export async function parseFileBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<ParsedResumeData> {
  let text = "";

  const ext = originalName.toLowerCase().split(".").pop() || "";

  if (mimeType === "application/pdf" || ext === "pdf") {
    const { extractText } = await import("unpdf");
    const result = await extractText(new Uint8Array(buffer));
    text = result.text;
  } else if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (mimeType === "application/msword" || ext === "doc") {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel" ||
    ext === "xlsx" ||
    ext === "xls"
  ) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const texts: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (sheet) {
        texts.push(XLSX.utils.sheet_to_csv(sheet));
      }
    }
    text = texts.join("\n");
  } else if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimeType === "application/vnd.ms-powerpoint" ||
    ext === "pptx" ||
    ext === "ppt"
  ) {
    text = await extractPptxText(buffer);
  } else {
    text = buffer.toString("utf-8");
  }

  const name = extractName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);

  return { text, name, email, phone, fileName: originalName };
}

async function extractPptxText(buffer: Buffer): Promise<string> {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);
    const texts: string[] = [];

    const slideFiles = Object.keys(zip.files)
      .filter((f) => f.match(/ppt\/slides\/slide\d+\.xml/))
      .sort();

    for (const slideFile of slideFiles) {
      const content = await zip.files[slideFile].async("string");
      const textContent = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (textContent) {
        texts.push(textContent);
      }
    }

    return texts.join("\n");
  } catch {
    return buffer.toString("utf-8");
  }
}

function extractEmail(text: string): string {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : "";
}

function extractPhone(text: string): string {
  const phonePatterns = [
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    /(?:\+?\d{1,3}[-.\s]?)?\d{10}/,
    /(?:\+?\d{1,3}[-.\s]?)?\d{3}[-.\s]\d{3}[-.\s]\d{4}/,
  ];

  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return "";
}

function extractName(text: string): string {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const skipWords = [
    "resume", "curriculum", "vitae", "cv", "objective", "summary",
    "experience", "education", "skills", "address", "contact",
    "profile", "about", "portfolio",
  ];

  for (const line of lines.slice(0, 10)) {
    if (emailRegex.test(line)) continue;
    if (phoneRegex.test(line)) continue;
    if (skipWords.some((w) => line.toLowerCase().startsWith(w))) continue;

    const cleaned = line.replace(/[^a-zA-Z\s.',-]/g, "").trim();
    const words = cleaned.split(/\s+/).filter((w) => w.length > 1);
    if (words.length >= 2 && words.length <= 5 && cleaned.length <= 60) {
      return cleaned;
    }
  }

  return "";
}
