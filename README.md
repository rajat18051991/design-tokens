<<<<<<< HEAD
# design-tokens
=======
# Design Tokens

A design token system that supports multiple themes and states. This project uses Style Dictionary to transform design tokens into various formats (CSS, SCSS, and JavaScript).

## Structure

```
.
├── tokens/                 # Design token definitions
│   ├── primitive.*.json   # Base color and typography tokens
│   ├── theme.*.json      # Theme-specific overrides
│   ├── action.*.json     # Interactive state tokens
│   └── density.*.json    # Spacing and sizing tokens
├── build/                 # Generated output files
│   ├── css/              # CSS variables
│   ├── scss/             # SCSS variables
│   └── js/               # JavaScript modules
├── build.js              # Build script
└── package.json          # Project configuration
```

## Usage

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build tokens:
   ```bash
   npm run build
   ```

3. Watch for changes during development:
   ```bash
   npm run build:watch
   ```

## Token Categories

- **Primitive Tokens**: Base colors, typography, and spacing values
- **Theme Tokens**: Theme-specific overrides (light/dark)
- **Action Tokens**: Interactive state definitions (normal/disabled)
- **Density Tokens**: Spacing and sizing variations

## Output Formats

The build process generates tokens in multiple formats:

- CSS Variables (`build/css/tokens.css`)
- SCSS Variables (`build/scss/_tokens.scss`)
- JavaScript Modules (`build/js/tokens.js`)

## Contributing

1. Add or modify tokens in the appropriate JSON files
2. Run the build command to generate updated outputs
3. Test the changes in your application

## License

MIT 
>>>>>>> e10254af33d7dacd5f6fe7213a26d3f03cd6b519
