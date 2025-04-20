import StyleDictionary from 'style-dictionary';
import getStyleDictionaryConfig from './config.js';

try {
  const config = getStyleDictionaryConfig();
  const sd = StyleDictionary.extend(config);
  sd.buildAllPlatforms();
  console.log('✨ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}