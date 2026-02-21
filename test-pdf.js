const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function testPdf() {
    console.log(pdfjsLib.version);
}
testPdf();
