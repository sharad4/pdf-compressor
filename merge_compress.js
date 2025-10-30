/**
 * Merge all PDFs in a folder and compress under 200 KB with Ghostscript
 * Author: ChatGPT
 */

import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { execSync } from "child_process";

// === CONFIGURATION ===
const inputDir = "./pdfs"; // Folder with PDFs
const mergedFile = "merged.pdf";
const compressedFile = "merged_compressed.pdf";
const targetSizeKB = 200; // Target size in KB

async function mergePDFs() {
  const files = fs
    .readdirSync(inputDir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .map((f) => path.join(inputDir, f));

  if (files.length === 0) {
    console.error("❌ No PDFs found in folder:", inputDir);
    process.exit(1);
  }

  console.log(`📄 Found ${files.length} PDFs. Merging...`);

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const pdfBytes = fs.readFileSync(file);
    const pdf = await PDFDocument.load(pdfBytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedBytes = await mergedPdf.save();
  fs.writeFileSync(mergedFile, mergedBytes);

  console.log(`✅ Merged successfully → ${mergedFile}`);
}

function compressPDF(input, output) {
  console.log("🔧 Compressing with Ghostscript...");

  // Start with medium quality (/ebook)
  const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook \
    -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${output} ${input}`;

  execSync(gsCommand);

  // Check file size
  const stats = fs.statSync(output);
  const sizeKB = stats.size / 1024;

  if (sizeKB > targetSizeKB) {
    console.log(`⚠️ Size is ${Math.round(sizeKB)}KB > ${targetSizeKB}KB, recompressing...`);
    const gsCommandLow = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen \
      -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${output} ${input}`;
    execSync(gsCommandLow);
  }

  const finalStats = fs.statSync(output);
  console.log(`✅ Final size: ${(finalStats.size / 1024).toFixed(1)} KB`);
}

(async () => {
  await mergePDFs();
  compressPDF(mergedFile, compressedFile);
  console.log(`🎉 Done! Output → ${compressedFile}`);
})();
