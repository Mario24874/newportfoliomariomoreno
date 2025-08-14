# 🎨 Portfolio Customization Guide

This guide will help you easily customize your portfolio with your own content, images, and information.

## 📋 Quick Setup Checklist

### 1. Personal Information
Edit `/src/data/portfolioData.ts` and update these constants:

```typescript
export const YOUR_NAME = "Your Full Name";
export const YOUR_TITLE = "Your Professional Title";
export const YOUR_EMAIL = "your.email@example.com";
export const YOUR_WHATSAPP_NUMBER = "+1234567890";
export const YOUR_LINKEDIN_URL = "https://linkedin.com/in/yourprofile";
export const YOUR_GITHUB_URL = "https://github.com/yourusername";
export const YOUR_DESCRIPTION = "Your professional description";
```

### 2. Projects Section
In the same file, update the `PROJECTS` array:

#### Adding a New Project:
```typescript
{
  id: 'unique-id',
  title: 'Project Title',
  description: 'Project description...',
  technologies: ['React', 'Node.js', 'etc'],
  imageUrl: 'https://your-image-url.com/image.jpg',
  liveUrl: 'https://your-demo.com', // Optional
  repoUrl: 'https://github.com/your-repo', // Optional
}
```

#### Removing a Project:
Simply delete the entire project object from the array.

### 3. Skills Section
Update the `SKILL_CATEGORIES` array to match your expertise:

```typescript
{
  title: 'Category Name',
  skills: [
    { name: 'Skill 1' },
    { name: 'Skill 2' },
    // Add more skills...
  ],
}
```

### 4. Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# ElevenLabs Voice Assistant
VITE_ELEVENLABS_AGENT_ID=your-agent-id

# n8n Automation (optional)
VITE_N8N_WEBHOOK_URL=https://your-n8n-webhook.com

# API Base URL (optional)
VITE_API_BASE_URL=http://localhost:3000
```

## 🖼️ Images and Media

### Project Images
- **Recommended size**: 600x400px
- **Format**: JPG, PNG, or WebP
- **Options**:
  1. Use placeholder service: `https://picsum.photos/600/400`
  2. Upload to image hosting service (Cloudinary, ImageKit, etc.)
  3. Place in `/public/images/` folder and reference as `/images/filename.jpg`

### Profile Pictures (if you add them)
- **Recommended size**: 400x400px (square)
- **Format**: JPG or PNG

## 🎯 Advanced Customization

### Colors and Styling
The portfolio uses Tailwind CSS. Main colors:
- Primary: `blue-400`, `blue-500`, `blue-600`
- Background: `gray-900`, `gray-800`
- Text: `white`, `gray-100`, `gray-300`

To change colors, search and replace in the components.

### Animations
Powered by Framer Motion. Current animations:
- Fade in on scroll
- Hover effects
- Typing animation in hero section

### Adding New Sections
1. Create component in `/src/sections/`
2. Import and add to `/src/App.tsx`
3. Add navigation item to `/src/data/portfolioData.ts`

## 🔗 n8n Integration Features

### Automatic Content Management
- Dynamic project updates
- Skill synchronization
- Contact form submissions
- Analytics tracking

### Setting Up n8n Webhooks
1. Create workflows in n8n
2. Set webhook URLs in environment variables
3. Use provided hooks: `useContentManager`, `useAnalytics`

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Popular Platforms
- **Vercel**: Connect GitHub repo
- **Netlify**: Drag and drop `dist` folder
- **GitHub Pages**: Use GitHub Actions
- **Firebase**: `firebase deploy`

## 📱 Mobile Responsiveness

The portfolio is fully responsive with breakpoints:
- Mobile: `sm:` (640px+)
- Tablet: `md:` (768px+)
- Desktop: `lg:` (1024px+)

## 🔧 Maintenance

### Updating Dependencies
```bash
npm update
npm audit fix
```

### Adding New Dependencies
```bash
npm install package-name
npm install -D package-name # for dev dependencies
```

## 💡 Tips for Best Results

### SEO Optimization
1. Update `index.html` title and meta tags
2. Add descriptive alt text to images
3. Use semantic HTML structure
4. Optimize image sizes

### Performance
1. Optimize images before uploading
2. Use lazy loading for images
3. Minimize bundle size
4. Enable caching for static assets

### Accessibility
1. Maintain good color contrast
2. Add ARIA labels where needed
3. Ensure keyboard navigation works
4. Test with screen readers

## 🆘 Troubleshooting

### Common Issues
1. **Build fails**: Check TypeScript errors
2. **Images not loading**: Verify URLs and formats
3. **Animations not working**: Check Framer Motion setup
4. **Styles not applying**: Verify Tailwind classes

### Getting Help
1. Check browser console for errors
2. Review this documentation
3. Search existing issues
4. Create new issue with details

---

## 📝 Content Templates

### Project Description Template
```
[Brief overview of what the project does]

Key features:
- Feature 1
- Feature 2  
- Feature 3

Technologies used: [List main technologies]

[Optional: Challenges overcome or lessons learned]
```

### Professional Description Template
```
[Your role/title] specializing in [main expertise areas]. 

I help [target audience] by [main value proposition].

[Optional: Years of experience or key achievement]
```

Ready to make this portfolio your own? Start with updating your personal information in `portfolioData.ts`! 🎉