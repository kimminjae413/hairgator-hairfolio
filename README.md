# Hairfolio - AI Hairstyle Try-On Platform

> Transform your look with AI-powered hairstyle visualization using VModel AI

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_SITE_ID/deploy-status)](https://app.netlify.com/sites/YOUR_SITE_NAME/deploys)

## 🌟 Features

- **AI-Powered Hairstyle Transfer**: Advanced VModel AI for realistic hairstyle application
- **Designer Portfolio Management**: Create and manage your hairstyle portfolio
- **Client Try-On Experience**: Interactive hairstyle testing for clients
- **Analytics Dashboard**: Track portfolio performance and client engagement
- **Booking Integration**: Direct Naver Reservation integration
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🚀 Live Demo

- **Demo Site**: [https://your-site.netlify.app](https://your-site.netlify.app)
- **Designer Login**: Use "Sample Designer" to explore the platform

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **AI Service**: VModel AI API
- **Deployment**: Netlify + GitHub Actions
- **Storage**: Local Storage (for demo)

## 📦 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hairfolio-vmodel.git
   cd hairfolio-vmodel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your VModel API key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

### Environment Variables

Create a `.env.local` file with:

```bash
# VModel AI API Key (get from https://vmodel.ai)
VMODEL_API_KEY=your_api_key_here
VITE_VMODEL_API_KEY=your_api_key_here
```

## 🌐 Deployment

### Deploy to Netlify

#### Method 1: One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/hairfolio-vmodel)

#### Method 2: Manual Setup

1. **Connect GitHub Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Configure Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Set Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add `VMODEL_API_KEY` with your API key

4. **Deploy**
   - Netlify will automatically build and deploy your site
   - Every push to main branch triggers a new deployment

### GitHub Actions (Optional)

The repository includes GitHub Actions for automated deployment:

1. **Setup Repository Secrets**
   ```
   VMODEL_API_KEY: Your VModel API key
   NETLIFY_AUTH_TOKEN: Your Netlify auth token
   NETLIFY_SITE_ID: Your Netlify site ID
   ```

2. **Auto-deploy**: Push to main branch triggers deployment

## 🎯 How to Use

### For Hair Designers

1. **Create Account**
   - Click "Sign Up" and choose a unique designer name
   - Your portfolio starts with sample hairstyles

2. **Manage Portfolio**
   - Upload your hairstyle photos
   - Categorize by gender and style type
   - Set your Naver Reservation booking URL

3. **Share Portfolio**
   - Use the Share button to get your unique portfolio link
   - Share QR code with clients
   - Track analytics on visits and bookings

### For Clients

1. **Access Portfolio**
   - Open designer's shared link
   - Upload a clear front-facing photo

2. **Try Hairstyles**
   - Browse the designer's portfolio
   - Click any style to see it applied to your photo
   - Compare before/after results

3. **Book Appointment**
   - Click "Book Now" if you like a style
   - Direct integration with Naver Reservation

## 🔧 API Integration

### VModel AI Setup

1. **Get API Key**
   - Visit [VModel.ai](https://vmodel.ai)
   - Create account and get API key
   - Pricing: $0.08 per hairstyle generation

2. **API Features Used**
   - Model: `vmodel/ai-hairstyle`
   - Mode: Fast processing (8-18 seconds)
   - Input: Source hairstyle + Target face photos

## 📊 Project Structure

```
hairfolio-vmodel/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── icons/
│   │   ├── ClientView.tsx
│   │   ├── DesignerView.tsx
│   │   ├── Login.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── HairstyleGallery.tsx
│   │   ├── ResultDisplay.tsx
│   │   ├── ShareModal.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── UploadStyleModal.tsx
│   │   ├── AnalyticsDashboard.tsx
│   │   └── ErrorBoundary.tsx
│   ├── services/
│   │   ├── vmodelService.ts
│   │   └── localStorageService.ts
│   ├── App.tsx
│   ├── index.tsx
│   ├── types.ts
│   └── portfolioImages.ts
├── .github/workflows/
│   └── deploy.yml
├── netlify.toml
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## 🎨 Customization

### Adding New Hairstyle Categories

Edit `src/types.ts`:
```typescript
export type FemaleMajorCategory = 'A length' | 'B length' | 'Your New Category';
export type MaleMajorCategory = 'BUZZ' | 'CROP' | 'Your New Category';
```

### Styling

The project uses Tailwind CSS. Customize colors in components or modify the Tailwind config.

### Default Portfolio

Modify `src/portfolioImages.ts` to change the default hairstyles for new designers.

## 📊 Analytics Features

- **Portfolio visits tracking**
- **Style try-on counts**
- **Booking conversion rates**
- **Most popular hairstyles**
- **Session-based visit tracking**

## 🔒 Security & Privacy

- **Client-side processing**: User photos processed securely via API
- **No permanent storage**: Images not stored on servers
- **API key protection**: Environment variables for secure key management
- **HTTPS enforcement**: Secure data transmission

## 🚧 Limitations & Considerations

### Current Limitations

- **Temporary image URLs**: Uses blob URLs (works for demo)
- **Local storage**: Portfolio data stored locally
- **Basic analytics**: Simple tracking implementation

### Production Recommendations

- **Cloud storage**: Use AWS S3, Cloudinary for image hosting
- **Database**: Replace localStorage with proper database
- **CDN**: Use CDN for faster image loading
- **Monitoring**: Add error tracking and performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

- **VModel AI**: Advanced hairstyle transfer technology
- **Sample Images**: Styled hairstyle photos for demo portfolio
- **Tailwind CSS**: Beautiful, responsive UI components

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/hairfolio-vmodel/issues)
- **Documentation**: This README and inline code comments
- **VModel API**: [VModel Documentation](https://docs.vmodel.ai)

---

**Made with ❤️ for hair designers and their clients**
