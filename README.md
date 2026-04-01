# Secure Cloud File Sharing System

Enterprise-grade secure file sharing platform with Azure AD authentication, MFA, RBAC, AES-256 file encryption, Azure Blob Storage, and full audit logging.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   React.js SPA  →  Azure Static Web Apps (CDN)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS + JWT (15min) + Refresh Cookie
┌────────────────────────────▼────────────────────────────────────┐
│                        API LAYER                                │
│   Node.js + Express  →  Azure App Service                       │
│   • Helmet CSP  • Rate Limiting (per-user)  • CORS             │
│   • Access Token (15m)  • Refresh Token (7d, httpOnly cookie)  │
└──────┬──────────────────────┬──────────────────────────────────┘
       │                      │
┌──────▼──────┐    ┌──────────▼──────────────────────────────────┐
│  MongoDB    │    │              AZURE SERVICES                  │
│  Atlas      │    │  • Blob Storage  (AES-256-CBC encrypted)     │
│  (metadata) │    │  • Key Vault     (secrets management)        │
└─────────────┘    │  • Monitor/App Insights (structured logs)    │
                   │  • AD + MFA      (identity)                  │
                   └─────────────────────────────────────────────┘
```

---

## Security Features

| Feature | Implementation |
|---|---|
| Authentication | JWT access (15min) + refresh token (7d, httpOnly cookie) |
| MFA | TOTP-based OTP via email, backup codes |
| File Encryption | AES-256-CBC with per-file IV stored in Blob metadata |
| RBAC | Admin / User / Viewer roles enforced at route level |
| Password Hashing | bcrypt with 12 salt rounds |
| Rate Limiting | Global 100 req/15min + auth 10 req/15min, keyed per user |
| Security Headers | Helmet with strict CSP, HSTS, X-Frame-Options |
| File Validation | MIME type + extension whitelist, 10MB size limit |
| Secure Share Links | Cryptographically random token, expiry, optional bcrypt password |
| Audit Logging | Every action logged to MongoDB + Azure Monitor |
| Suspicious Activity | Failed login spike detection in admin dashboard |

---

## Project Structure

```
CBSS Project/
├── .github/workflows/deploy.yml     # CI/CD pipeline
├── backend/
│   ├── config/
│   │   ├── azureBlob.js             # Blob Storage + AES encryption
│   │   ├── azureKeyVault.js
│   │   ├── azureMonitor.js
│   │   └── database.js
│   ├── controllers/
│   │   ├── adminController.js       # Dashboard stats + alerts
│   │   ├── authController.js        # Access + refresh tokens
│   │   ├── fileController.js        # Upload/download/share/links
│   │   ├── logController.js         # Filtered audit logs
│   │   ├── mfaController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js                  # JWT protect + RBAC authorize
│   │   ├── errorHandler.js
│   │   ├── mfaMiddleware.js
│   │   ├── upload.js                # Memory storage + MIME validation
│   │   └── validator.js
│   ├── models/
│   │   ├── ActivityLog.js
│   │   ├── File.js                  # blobName, encryptionIV, shareToken
│   │   ├── Permission.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── fileRoutes.js
│   │   ├── logRoutes.js
│   │   ├── mfaRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── activityLogger.js
│   │   └── mfaService.js
│   └── server.js
└── frontend/
    └── src/
        ├── components/
        │   ├── ShareModal.js        # User share + secure link tabs
        │   └── ...
        ├── context/AuthContext.js   # Auto token refresh
        ├── pages/
        │   ├── Dashboard.js         # Recharts stats + activity charts
        │   ├── ActivityLogs.js      # Filtered + paginated logs
        │   └── ...
        └── services/
            ├── authService.js       # Axios + refresh interceptor
            └── fileService.js       # generateShareLink
```

---

## Setup

### 1. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cd backend && copy .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/secure-file-sharing

JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<different-64-char-random-string>

AZURE_TENANT_ID=<from-azure-portal>
AZURE_CLIENT_ID=<app-registration-client-id>
AZURE_CLIENT_SECRET=<app-registration-secret>

AZURE_STORAGE_CONNECTION_STRING=<from-storage-account>
AZURE_STORAGE_ACCOUNT=<account-name>
AZURE_STORAGE_KEY=<account-key>
AZURE_BLOB_CONTAINER=secure-files

FILE_ENCRYPTION_KEY=<64-hex-chars>   # openssl rand -hex 32

AZURE_KEY_VAULT_URL=https://<vault>.vault.azure.net/
AZURE_MONITOR_CONNECTION_STRING=<app-insights-connection-string>

EMAIL_USER=<gmail>
EMAIL_PASSWORD=<app-password>
FRONTEND_URL=http://localhost:3000
```

### 3. Start

```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm start
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register user |
| POST | `/api/auth/login` | — | Login, returns access token + sets refresh cookie |
| POST | `/api/auth/refresh` | Cookie | Rotate access token |
| POST | `/api/auth/logout` | Bearer | Clear refresh cookie |
| GET | `/api/auth/me` | Bearer | Current user |

### Files
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/files/upload` | Bearer | Upload (→ Azure Blob, AES encrypted) |
| GET | `/api/files` | Bearer | List files (search, tag, page, limit) |
| GET | `/api/files/download/:id` | Bearer + MFA | Download decrypted file |
| DELETE | `/api/files/:id` | Bearer + MFA | Delete from Blob + DB |
| POST | `/api/files/share` | Bearer + MFA | Share with registered user |
| POST | `/api/files/share/generate` | Bearer | Generate secure link (expiry + password) |
| GET/POST | `/api/files/share/link/:token` | — | Access shared link |

### Admin (Admin role only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Users, files, activity, alerts |
| GET | `/api/users` | All users |
| PUT | `/api/users/:id/role` | Change role |
| PUT | `/api/users/:id/deactivate` | Deactivate user |

### Logs
| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| GET | `/api/logs` | action, status, userId, startDate, endDate, page, limit | Filtered logs |
| GET | `/api/logs/stats` | — | Aggregated stats by action/status/day |

---

## Deployment

### Azure App Service (Backend)

```bash
az webapp create \
  --resource-group SecureFileSharing-RG \
  --plan SecureFileSharing-Plan \
  --name secure-file-sharing-api \
  --runtime "NODE:20-lts"

az webapp config appsettings set \
  --name secure-file-sharing-api \
  --resource-group SecureFileSharing-RG \
  --settings @backend/.env
```

### Azure Static Web Apps (Frontend)

```bash
az staticwebapp create \
  --name secure-file-sharing-ui \
  --resource-group SecureFileSharing-RG \
  --source https://github.com/<your-repo> \
  --branch main \
  --app-location /frontend \
  --output-location build
```

### MongoDB Atlas

1. Create cluster at https://cloud.mongodb.com
2. Whitelist Azure App Service outbound IPs
3. Update `MONGODB_URI` in App Service settings

### CI/CD (GitHub Actions)

Add these secrets to your GitHub repository:

| Secret | Value |
|---|---|
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Download from App Service → Get publish profile |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | From Static Web App → Manage deployment token |
| `JWT_SECRET` | Your JWT secret |
| `MONGODB_URI_TEST` | Test database URI |
| `REACT_APP_API_URL` | `https://secure-file-sharing-api.azurewebsites.net/api` |

---

## Troubleshooting

```bash
# MongoDB not running
net start MongoDB

# Port 5000 in use
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Azure Blob not configured — app falls back to local ./uploads
# Check health endpoint for storage mode:
curl http://localhost:5000/api/health
```
