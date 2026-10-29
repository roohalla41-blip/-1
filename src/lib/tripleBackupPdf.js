/**
 * Emergency architecture snapshot for Hesab Sarraf.
 * This records repository-level facts only; it is not a live Supabase export.
 */
import { jsPDF } from 'jspdf';

export function generateTripleBackupPdf() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const left = 15;
  const maxWidth = 180;
  let y = 18;
  const lineHeight = 6;
  const date = new Date().toISOString();

  const addLine = (text, size = 10, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(String(text), maxWidth);
    if (y + lines.length * lineHeight > 278) {
      doc.addPage();
      y = 18;
    }
    doc.text(lines, left, y);
    y += lines.length * lineHeight;
  };
  const section = (title) => {
    y += 3;
    addLine(title, 13, true);
    doc.setDrawColor(170);
    doc.line(left, y - 2, 195, y - 2);
    y += 2;
  };

  addLine('HESAB SARRAF — EMERGENCY ARCHITECTURE SNAPSHOT', 15, true);
  addLine('Generated: ' + date, 9);
  addLine('Project: A1 / Hesab Sarraf', 9);
  addLine('Purpose: recovery and review documentation; not a live-system attestation.', 9);

  section('1. Repository facts');
  addLine('- Frontend uses React and Vite; build command is npm run build.');
  addLine('- Supabase is used for PostgreSQL-backed application data.');
  addLine('- Frontend data operations are routed through src/lib/supabaseApi.js and callSupabase().');
  addLine('- Emergency backup UI: src/components/sarraaf/TripleBackup.jsx.');
  addLine('- Backup helpers: src/lib/tripleBackupPdf.js, tripleBackupZip.js, tripleBackupSupabase.js.');

  section('2. Output scope and limitations');
  addLine('- This PDF is generated from repository documentation and code notes. It does not inspect the live database.');
  addLine('- The Supabase SQL helper packages local SQL/documentation files; it does not guarantee that these match the live schema.');
  addLine('- The ZIP is a source repository archive. It does not include live database records or private signing keys.');
  addLine('- An APK must be produced by a successful build and have its signature verified before it can be called a valid release.');

  section('3. Security requirements');
  addLine('- Never include passwords, service-role keys, authentication tokens, or Android signing keystores in a public ZIP or PDF.');
  addLine('- Do not execute SQL migrations or change RLS policies based only on this document.');
  addLine('- Per-user financial PDFs must be generated only after server-side authorization and strict account/tenant scoping.');
  addLine('- A user report must contain only the selected account’s authorized data and must not change any database records.');

  section('4. Recovery verification checklist');
  addLine('- Compare live tables, columns, constraints, indexes, views, functions, triggers, and RLS policies using authorized read-only inspection.');
  addLine('- Confirm a restorable database backup separately; this PDF is not a database backup.');
  addLine('- Verify build success and APK signature before publishing.');
  addLine('- Test user-specific reports with separate customer and exchange accounts before enabling delivery.');

  section('5. Provenance');
  addLine('Generated at: ' + date);
  addLine('No live database data, credentials, or secrets are embedded in this document.');
  const filename = 'hesab-sarraf-emergency-architecture-' + date.slice(0, 10) + '.pdf';
  doc.save(filename);
  return filename;
}
