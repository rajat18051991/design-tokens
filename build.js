const StyleDictionary = require('style-dictionary');
const path = require('path');
const fs = require('fs');

// Read the manifest file
console.log('Building design tokens...');
const manifestPath = path.resolve(__dirname, 'tokens/manifest.json');

// Check if manifest.json exists
if (!fs.existsSync(manifestPath)) {
  console.error('Error: tokens/manifest.json file not found');
  process.exit(1);
}

// Load the manifest file
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
console.log('Manifest loaded:');
console.log(JSON.stringify(manifest, null, 2));

// Register a custom parser for our token format
StyleDictionary.registerParser({
  pattern: /\.json$/,
  parse: ({ contents, filePath }) => {
    const json = JSON.parse(contents);
    console.log(`Parsing file: ${filePath}`);
    
    // Create a transformed object that Style Dictionary can process
    const transformedTokens = {};
    const primitiveMode = filePath.includes('dark') ? 'dark' : 'light';
    const isTheme = filePath.includes('theme.');
    const themeName = isTheme ? (filePath.includes('Prism') ? 'prism' : 'danland') : null;
    
    // Helper function to recursively process tokens
    function processTokens(obj, path = []) {
      for (const key in obj) {
        const newPath = [...path, key];
        const value = obj[key];
        
        // Check if this is a token with $value
        if (value && value.$value !== undefined) {
          const tokenPath = newPath.join('.');
          
          // Check if $value contains references
          let resolvedValue = value.$value;
          if (typeof resolvedValue === 'string' && resolvedValue.includes('{')) {
            // Process references
            resolvedValue = resolvedValue.replace(/\{([^}]+)\}/g, (match, refPath) => {
              // Handle theme token references
              if (refPath.startsWith('theme.')) {
                // If it's a theme reference in a theme file, insert the theme name after 'theme.'
                if (isTheme && !refPath.includes(`theme.${themeName}.`)) {
                  // Insert themeName after 'theme.'
                  const parts = refPath.split('.');
                  parts.splice(1, 0, themeName);
                  const newRefPath = parts.join('.');
                  console.log(`Updating reference from ${refPath} to ${newRefPath}`);
                  return `var(--${newRefPath.replace(/\./g, '-')})`;
                }
                // Convert theme references to CSS variables
                return `var(--${refPath.replace(/\./g, '-')})`;
              } else {
                // For primitive references, create CSS variables with the mode prefix
                return `var(--${primitiveMode}-${refPath.replace(/\./g, '-')})`;
              }
            });
          }
          
          // Store the processed token
          transformedTokens[tokenPath] = {
            value: resolvedValue,
            type: value.$type || 'string',
            ...(value.$description ? { description: value.$description } : {})
          };
        } 
        // Otherwise, continue recursively
        else if (value && typeof value === 'object') {
          processTokens(value, newPath);
        }
      }
    }
    
    // Start processing from the root
    processTokens(json);
    
    console.log(`Transformed ${Object.keys(transformedTokens).length} tokens`);
    
    return {
      tokens: transformedTokens
    };
  }
});

// Register custom formats for CSS, SCSS, and JS
StyleDictionary.registerFormat({
  name: 'css/variables',
  formatter: function(dictionary, config) {
    console.log(`Processing ${dictionary.allProperties.length} properties for CSS`);
    
    if (dictionary.allProperties.length === 0) {
      console.log('No properties found for CSS!');
      return `:root {\n  /* No tokens found */\n}`;
    }
    
    return `:root {\n${dictionary.allProperties
      .map(prop => {
        console.log(`  Processing property: ${prop.name} = ${prop.value}`);
        return `  --${prop.name}: ${prop.value};`;
      })
      .join('\n')}\n}`;
  }
});

StyleDictionary.registerFormat({
  name: 'scss/variables',
  formatter: function(dictionary, config) {
    console.log(`Processing ${dictionary.allProperties.length} properties for SCSS`);
    
    if (dictionary.allProperties.length === 0) {
      console.log('No properties found for SCSS!');
      return `// No tokens found`;
    }
    
    return `// Design tokens SCSS variables\n${dictionary.allProperties
      .map(prop => {
        return `$${prop.name}: ${prop.value};`;
      })
      .join('\n')}`;
  }
});

StyleDictionary.registerFormat({
  name: 'javascript/module',
  formatter: function(dictionary, config) {
    console.log(`Processing ${dictionary.allProperties.length} properties for JS`);
    
    if (dictionary.allProperties.length === 0) {
      console.log('No properties found for JS!');
      return `export default {}; // No tokens found`;
    }
    
    return `// Design tokens JS module
export default ${JSON.stringify(dictionary.tokens, null, 2)};`;
  }
});

// Register formatters to prefix names for each set
StyleDictionary.registerTransform({
  name: 'name/primitivePrefix',
  type: 'name',
  matcher: function(prop) {
    return prop.filePath.includes('primitive.');
  },
  transformer: function(prop) {
    const mode = prop.filePath.includes('dark') ? 'dark' : 'light';
    return `${mode}-${prop.path.join('-')}`;
  }
});

StyleDictionary.registerTransform({
  name: 'name/themePrefix',
  type: 'name',
  matcher: function(prop) {
    return prop.filePath.includes('theme.');
  },
  transformer: function(prop) {
    return prop.path.join('-');
  }
});

// Update the transform groups to include our naming transforms
StyleDictionary.registerTransformGroup({
  name: 'tokens/primitive',
  transforms: [
    'name/primitivePrefix'
  ]
});

StyleDictionary.registerTransformGroup({
  name: 'tokens/theme',
  transforms: [
    'name/themePrefix'
  ]
});

// Check for primitive modes
console.log('Primitive modes:');
if (manifest.collections.primitive.modes) {
  console.log(Object.keys(manifest.collections.primitive.modes));
} else {
  console.log('No primitive.modes found in manifest');
}

// Check for theme modes
console.log('Theme modes:');
if (manifest.collections.theme.modes) {
  console.log(Object.keys(manifest.collections.theme.modes));
} else {
  console.log('No theme.modes found in manifest');
}

// Function to build primitive tokens for a specific mode
function buildPrimitiveTokens(mode) {
  console.log(`Building primitive tokens for ${mode} mode...`);
  
  const files = manifest.collections.primitive.modes[mode].map(file => `tokens/${file}`);
  
  const sd = StyleDictionary.extend({
    source: files,
    platforms: {
      css: {
        transformGroup: 'tokens/primitive',
        buildPath: `build/primitive/${mode}/`,
        files: [
          {
            destination: 'css/variables.css',
            format: 'css/variables',
            options: {
              showFileHeader: false,
              outputReferences: false
            }
          }
        ]
      },
      scss: {
        transformGroup: 'tokens/primitive',
        buildPath: `build/primitive/${mode}/`,
        files: [
          {
            destination: 'scss/_tokens.scss',
            format: 'scss/variables',
            options: {
              showFileHeader: false,
              outputReferences: false
            }
          }
        ]
      },
      js: {
        transformGroup: 'tokens/primitive',
        buildPath: `build/primitive/${mode}/`,
        files: [
          {
            destination: 'js/tokens.js',
            format: 'javascript/module',
            options: {
              showFileHeader: false,
              outputReferences: false
            }
          }
        ]
      }
    }
  });
  
  sd.buildAllPlatforms();
}

// Function to build theme tokens for a specific mode
function buildThemeTokens(theme, primitiveMode) {
  console.log(`Building theme tokens for ${theme} theme with ${primitiveMode} primitive mode...`);
  
  const themeFiles = manifest.collections.theme.modes[theme].map(file => `tokens/${file}`);
  
  // Custom parser for theme files that references the correct primitive mode
  StyleDictionary.registerParser({
    pattern: /theme\..+\.tokens\.json$/,
    parse: ({ contents, filePath }) => {
      const json = JSON.parse(contents);
      console.log(`Parsing theme file: ${filePath} with primitive mode: ${primitiveMode}`);
      
      // Create a transformed object that Style Dictionary can process
      const transformedTokens = {};
      const themeName = filePath.includes('Prism') ? 'prism' : 'danland';
      
      // Helper function to recursively process tokens
      function processTokens(obj, path = []) {
        for (const key in obj) {
          const newPath = [...path, key];
          const value = obj[key];
          
          // Check if this is a token with $value
          if (value && value.$value !== undefined) {
            const tokenPath = newPath.join('.');
            
            // Check if $value contains references
            let resolvedValue = value.$value;
            if (typeof resolvedValue === 'string' && resolvedValue.includes('{')) {
              // Process references
              resolvedValue = resolvedValue.replace(/\{([^}]+)\}/g, (match, refPath) => {
                // Handle theme token references
                if (refPath.startsWith('theme.')) {
                  // If it's a theme reference, ensure it has the correct theme name
                  if (!refPath.includes(`theme.${themeName}.`)) {
                    // Insert themeName after 'theme.'
                    const parts = refPath.split('.');
                    parts.splice(1, 0, themeName);
                    const newRefPath = parts.join('.');
                    console.log(`Updating reference from ${refPath} to ${newRefPath}`);
                    return `var(--${newRefPath.replace(/\./g, '-')})`;
                  }
                  // Convert theme references to CSS variables
                  return `var(--${refPath.replace(/\./g, '-')})`;
                } else {
                  // For primitive references, create CSS variables with the mode prefix
                  return `var(--${primitiveMode}-${refPath.replace(/\./g, '-')})`;
                }
              });
            }
            
            // Store the processed token
            transformedTokens[tokenPath] = {
              value: resolvedValue,
              type: value.$type || 'string',
              ...(value.$description ? { description: value.$description } : {})
            };
          } 
          // Otherwise, continue recursively
          else if (value && typeof value === 'object') {
            processTokens(value, newPath);
          }
        }
      }
      
      // Start processing from the root
      processTokens(json);
      
      console.log(`Transformed ${Object.keys(transformedTokens).length} tokens`);
      
      return {
        tokens: transformedTokens
      };
    }
  });
  
  const sd = StyleDictionary.extend({
    source: themeFiles,
    platforms: {
      css: {
        transformGroup: 'tokens/theme',
        buildPath: `build/theme/${theme}-${primitiveMode}/`,
        files: [
          {
            destination: 'css/variables.css',
            format: 'css/variables',
            options: {
              showFileHeader: false,
              outputReferences: false
            }
          }
        ]
      },
      scss: {
        transformGroup: 'tokens/theme',
        buildPath: `build/theme/${theme}-${primitiveMode}/`,
        files: [
          {
            destination: 'scss/_tokens.scss',
            format: 'scss/variables',
            options: {
              showFileHeader: false,
              outputReferences: false
            }
          }
        ]
      },
      js: {
        transformGroup: 'tokens/theme',
        buildPath: `build/theme/${theme}-${primitiveMode}/`,
        files: [
          {
            destination: 'js/tokens.js',
            format: 'javascript/module',
            options: {
              showFileHeader: false,
              outputReferences: false
            }
          }
        ]
      }
    }
  });
  
  sd.buildAllPlatforms();
}

// Build all primitive tokens
for (const mode in manifest.collections.primitive.modes) {
  buildPrimitiveTokens(mode);
}

// Build all theme tokens with their respective primitive modes
for (const theme in manifest.collections.theme.modes) {
  for (const mode in manifest.collections.primitive.modes) {
    buildThemeTokens(theme, mode);
  }
}

console.log('Design tokens built successfully!');