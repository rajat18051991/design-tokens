import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONSTANTS = {
  BASE_TOKEN_FILE: 'numbers.base.tokens.json',
  PRIMITIVE_PREFIX: 'primitive.',
  TOKEN_SUFFIX: '.tokens.json'
};

function getTokenFiles() {
  const tokensDir = path.resolve(__dirname, 'tokens');
  return fs.readdirSync(tokensDir)
    .filter(file => file.endsWith(CONSTANTS.TOKEN_SUFFIX))
    .reduce((acc, file) => {
      try {
        const filePath = path.join(tokensDir, file);
        acc[file] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        console.warn(`Warning: Could not parse ${file}`, e);
      }
      return acc;
    }, {});
}

// Add buildDependencyGraph function
function buildDependencyGraph(tokenFiles) {
  const graph = {};
  
  // Initialize graph with empty arrays for each file
  Object.keys(tokenFiles).forEach(file => {
    graph[file] = [];
  });

  // Build dependencies by looking for references
  Object.entries(tokenFiles).forEach(([fileName, content]) => {
    const contentStr = JSON.stringify(content);
    const references = contentStr.match(/\{([^}]+)\}/g) || [];
    
    references.forEach(ref => {
      const refRoot = ref.replace(/[{}]/g, '').split('.')[0];
      Object.entries(tokenFiles).forEach(([otherFile, otherContent]) => {
        if (otherFile !== fileName && JSON.stringify(otherContent).includes(`"${refRoot}"`)) {
          if (!graph[fileName].includes(otherFile)) {
            graph[fileName].push(otherFile);
          }
        }
      });
    });
  });

  return graph;
}

function getStyleDictionaryConfig() {
  const tokenFiles = getTokenFiles();
  const dependencyGraph = buildDependencyGraph(tokenFiles);
  const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'tokens/manifest.json'), 'utf8'));
  
  // ...existing code...
}

export default getStyleDictionaryConfig;