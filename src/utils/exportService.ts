import { jsPDF } from 'jspdf';
import type { UserProfile } from '../types';

export const generatePDF = (user: UserProfile) => {
    const doc = new jsPDF();
    const entries = user.journalEntries || [];

    // -- STYLING CONFIG --
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 20; // Current vertical position

    // Placeholder until I read types.ts
    // Helper to check page bounds and add new page if needed
    const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPos = 20; // Reset to top
            return true;
        }
        return false;
    };

    // -- HEADER --
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(50, 50, 50); // Dark Gray
    doc.text("Palante Journal", margin, yPos);
    yPos += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100); // Lighter Gray
    doc.text(`Reflections for ${user.name}`, margin, yPos);
    yPos += 15;

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    // -- ENTRIES --
    if (entries.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.text("No journal entries found yet.", margin, yPos);
    } else {
        // Sort entries by date (newest first)
        const sortedEntries = [...entries].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        sortedEntries.forEach((entry) => {
            // Entry Date Header
            checkPageBreak(30); // Check enough space for header

            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(60, 100, 60); // Sage-ish green
            const dateStr = new Date(entry.date).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            doc.text(dateStr, margin, yPos);
            yPos += 8;

            // Mood/Intention if available (Optional enhancement)
            // doc.setFontSize(10);
            // doc.setTextColor(150);
            // doc.text(`Mood: ${entry.mood} | Intention: ${entry.intention}`, margin, yPos);
            // yPos += 8;

            // Entry Body
            doc.setFont("times", "normal"); // Serif for better reading of body text
            doc.setFontSize(12);
            doc.setTextColor(20, 20, 20); // Nearly black

            const entryText = `Highlight: ${entry.highlight}\nMidpoint: ${entry.midpoint}\nLowlight: ${entry.lowlight}`;

            // Split text to fit width
            const splitText = doc.splitTextToSize(entryText, contentWidth);

            // Check if entire text fits, if not, print line by line handling page breaks
            const lineHeight = 7;
            const blockHeight = splitText.length * lineHeight;

            if (checkPageBreak(blockHeight)) {
                // If we broke page, re-print date header on new page (Optional)
            }

            splitText.forEach((line: string) => {
                checkPageBreak(lineHeight);
                doc.text(line, margin, yPos);
                yPos += lineHeight;
            });

            yPos += 10; // Spacing after entry
        });
    }

    doc.save(`Palante_Journal_${new Date().toISOString().split('T')[0]}.pdf`);
};
