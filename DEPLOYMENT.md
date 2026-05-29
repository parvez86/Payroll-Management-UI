# Deployment Guide - Payroll Frontend

## 🚀 Quick Deployment Checklist

### Pre-Deployment
- [ ] Test application in development mode
- [ ] Update `src/config/index.ts` for production settings
- [ ] Ensure backend API is accessible
- [ ] Verify all environment variables

### Production Configuration

1. **Update API Configuration** (`src/config/index.ts`):
```typescript
export const config = {
  USE_MOCK_API: false,                          // ← CRITICAL: Set to false
  API_BASE_URL: 'https://your-api.com/pms/v1/api', // ← Your backend URL
  
  // Keep business rules as-is
  MAX_EMPLOYEES: 10,
  GRADE_DISTRIBUTION: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 2 },
  
  // Optional: Update demo credentials
  DEMO_CREDENTIALS: {
    username: 'admin',
    password: 'your-secure-password'
  }
};
```

### Build & Deploy

#### Option 1: Static Hosting (Netlify, Vercel, GitHub Pages)
```bash
# Build for production
npm run build

# Test production build locally
npm run preview

# Deploy 'dist' folder to your hosting service
```

#### Option 2: Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

```bash
# Build and run
docker build -t payroll-frontend .
docker run -p 3000:3000 payroll-frontend
```

#### Option 3: AWS S3 + CloudFront
```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### Environment Variables (Optional)

Create `.env.production`:
```env
VITE_API_BASE_URL=https://your-api.com/pms/v1/api
VITE_USE_MOCK_API=false
```

Update config to use env vars:
```typescript
export const config = {
  USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API === 'true',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/pms/v1/api',
  // ...
};
```

### Post-Deployment Testing

1. **Login Flow**: Test with production credentials
2. **Employee CRUD**: Verify all operations work with backend
3. **Payroll Processing**: Test with real account balances
4. **Error Handling**: Test network failures and invalid data
5. **Mobile Responsiveness**: Test on various devices

### Troubleshooting

#### Common Issues:
- **404 on refresh**: Configure your hosting for SPA routing
- **CORS errors**: Ensure backend allows your domain
- **API connection fails**: Check network and API endpoints
- **Build errors**: Verify all dependencies and TypeScript config

#### Solutions:
```nginx
# Nginx config for SPA routing
location / {
  try_files $uri $uri/ /index.html;
}
```

```json
// Netlify: _redirects file
/*    /index.html   200
```

### Security Checklist

- [ ] HTTPS enabled
- [ ] Remove console.log statements
- [ ] Validate JWT expiration handling
- [ ] Test with invalid tokens
- [ ] Verify error messages don't expose sensitive data

### Performance Optimization

- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Implement code splitting if needed
- [ ] Optimize images and fonts
- [ ] Enable caching headers

### Monitoring Setup

- [ ] Set up error tracking (Sentry, Rollbar)
- [ ] Configure analytics (Google Analytics)
- [ ] Monitor API response times
- [ ] Set up uptime monitoring

---

**Deployment Status**: Ready for Production  
**Estimated Deploy Time**: 10-15 minutes  
**Support**: Check troubleshooting section or create an issue