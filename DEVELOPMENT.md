# Muchandy Webapp - Development Workflow

## Quick Start
```bash
# Initial setup
npm run fresh:setup

# Start development with content validation
npm run dev:content

# Build with full validation
npm run build:check
```

## Content Management Workflow

### 1. Environment Setup
- Copy `.env.example` to `.env.local`
- Add your Storyblok preview token
- Set `VITE_STORYBLOK_VERSION=draft` for development

### 2. Content Development
```bash
# Validate content before development
npm run validate:content

# Start development server
npm run dev:content
```

### 3. Component Development
- Components are in `src/components/StoryblokComponent.js`
- Follow Svarog UI patterns
- Test with Storyblok preview

### 4. Build & Deploy
```bash
# Full validation and build
npm run build:check

# Production server
npm run start:prod
```

## Storyblok Integration

### Component Mapping
Components are mapped in `componentMap`:
- `muchandy_hero` → MuchandyHero with forms
- `hero` → Standard hero
- `section` → Content sections
- `card` → Product/service cards

### Adding New Components
1. Create component in Storyblok
2. Add renderer to `componentMap`
3. Test with `npm run validate:content`

## Performance Guidelines
- Keep components lightweight
- Use Svarog UI patterns
- Validate content before deploy
- Monitor bundle size

## Debugging
- Use browser dev tools
- Check console for component errors
- Validate content structure
- Test API endpoints

