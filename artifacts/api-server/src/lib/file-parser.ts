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
    text = Array.isArray(result.text) ? result.text.join("\n") : String(result.text);
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

  const normalizedText = text
    .replace(/([A-Z](?: [A-Z]){2,})\s*([a-z])/g, (_, spaced, next) => {
      return spaced + " " + next;
    })
    .replace(/(\d)([A-Z])/g, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]{2,})([a-z])/g, (_, upper, lower) => upper.slice(0, -1) + " " + upper.slice(-1) + lower);

  const email = extractEmail(normalizedText);
  const phone = extractPhone(normalizedText);
  const name = extractName(normalizedText, originalName);

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
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const matches = [...text.matchAll(emailRegex)];
  if (!matches.length) return "";

  for (const m of matches) {
    const candidate = m[1];
    const idx = m.index ?? 0;
    const charBefore = idx > 0 ? text[idx - 1] : " ";
    if (/[\s\n]/.test(charBefore) || idx === 0) return candidate;
  }

  let raw = matches[0][1];
  const atIdx = raw.indexOf("@");
  let localPart = raw.substring(0, atIdx);
  const domain = raw.substring(atIdx + 1);

  const dotIdx = localPart.indexOf(".");
  if (dotIdx === -1) {
    const lowerStart = localPart.search(/[a-z]/);
    if (lowerStart > 0 && /^[A-Z]+$/.test(localPart.substring(0, lowerStart))) {
      localPart = localPart.substring(lowerStart);
    }
  }
  return localPart + "@" + domain;
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

function extractName(text: string, fileName: string = ""): string {
  if (fileName) {
    const base = fileName.replace(/\.[^.]+$/, "");
    const titleWords = /^(resume|cv|cover|letter|final|updated|new|old|copy|draft|senior|junior|manager|engineer|developer|designer|lead|director|specialist|analyst|consultant|intern|associate|coordinator|administrator|executive|officer|architect|head|vp|cto|ceo|cfo|ui|ux|uiux|qa|devops|fullstack|frontend|backend|software|data|product|project|hr|it|marketing|sales|finance|operations|research|medical|clinical|legal|creative|principal|staff)$/i;
    const nameParts = base
      .replace(/[-_]+/g, " ")
      .replace(/\d+/g, "")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1);
    const nameOnly: string[] = [];
    for (const part of nameParts) {
      if (/^[A-Za-z]+$/.test(part) && !titleWords.test(part)) {
        nameOnly.push(part);
      } else {
        break;
      }
    }
    if (nameOnly.length >= 2) {
      return toTitleCase(nameOnly.slice(0, 3).join(" "));
    }
  }

  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const urlRegex = /https?:\/\//;
  const skipWords = [
    "resume", "curriculum", "vitae", "cv", "objective", "summary",
    "experience", "education", "skills", "address", "contact",
    "profile", "about", "portfolio", "c o n t a c t", "a b o u t",
    "senior", "junior", "manager", "engineer", "developer", "designer",
    "lead", "director", "specialist",
  ];

  const consecutiveName: string[] = [];
  for (const line of lines.slice(0, 15)) {
    if (emailRegex.test(line)) continue;
    if (phoneRegex.test(line)) continue;
    if (urlRegex.test(line)) continue;
    if (skipWords.some((w) => line.toLowerCase().startsWith(w))) continue;
    if (/[.!?;:]/.test(line)) continue;

    const cleaned = line.replace(/[^a-zA-Z\s',-]/g, "").trim();
    if (!cleaned) continue;

    const words = cleaned.split(/\s+/).filter((w) => w.length > 1);
    if (words.length >= 2 && words.length <= 4 && cleaned.length <= 40) {
      const looksLikeName = words.every((w) => /^[A-Z][a-z]+$/.test(w) || /^[A-Z]+$/.test(w));
      if (looksLikeName) {
        return toTitleCase(cleaned);
      }
    }

    if (words.length === 1 && /^[A-Za-z]+$/.test(words[0]) && words[0].length >= 2) {
      consecutiveName.push(words[0]);
      if (consecutiveName.length >= 2) {
        return toTitleCase(consecutiveName.join(" "));
      }
    } else {
      consecutiveName.length = 0;
    }
  }

  return "";
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
