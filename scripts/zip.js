const AdmZip = require("adm-zip");
const path = require("path");
const base = path.join(__dirname, "..");

async function createZipArchive() {
  const zip = new AdmZip();
  const inputFolder = base + "/dist";
  const outputFile = base + "/dist.zip";
  zip.addLocalFolder(inputFolder);
  zip.writeZip(outputFile);

  console.log(`Created ${outputFile} successfully`);
}

createZipArchive().catch(console.log);
