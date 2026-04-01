# 🔐 Secure Cloud File Sharing System

An enterprise-grade secure cloud file sharing platform with authentication, Multi-Factor Authentication (MFA), Role-Based Access Control (RBAC), AES-256 encryption, and Azure cloud integration.

---

## 📌 Overview

This project is designed to provide a secure and scalable file sharing system where users can upload, manage, and share files with strict access control and encryption. It ensures data security using modern authentication mechanisms and cloud services.

---

## 🚀 Features

* 🔑 User Authentication (JWT-based Login/Register)
* 🔐 Multi-Factor Authentication (MFA)
* 📂 Secure File Upload & Download
* 👥 Role-Based Access Control (Admin / User / Viewer)
* 🔗 Secure File Sharing via Links (expiry + password protection)
* 📊 Activity Logging & Monitoring
* ☁️ Azure Blob Storage Integration
* 🔒 AES-256 File Encryption

---

## 🛠️ Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React.js                            |
| Backend  | Node.js, Express.js                 |
| Database | MongoDB (Atlas)                     |
| Cloud    | Azure Blob Storage, Azure Key Vault |
| Auth     | JWT + Refresh Tokens                |
| Security | Helmet, Rate Limiting               |

---

## 🏗️ Project Structure

```bash
CBSS Project/
├── backend/
├── frontend/
├── .github/
├── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/2300033173/secure-cloud-file-sharing-system.git
cd secure-cloud-file-sharing-system
```

---

### 2️⃣ Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

---

### 3️⃣ Configure Environment Variables

```bash
cd backend
copy .env.example .env
```

Update `.env` with your credentials:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret

AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_BLOB_CONTAINER=secure-files

EMAIL_USER=your_email
EMAIL_PASSWORD=your_app_password
```

---

### 4️⃣ Run the Application

```bash
# Run backend
cd backend
npm start

# Run frontend
cd frontend
npm start
```

---

## 🌐 Application URLs

* Frontend: http://localhost:3000
* Backend API: http://localhost:5000/api

---

## 🔐 Security Implementation

* JWT Authentication (Access + Refresh Tokens)
* MFA using OTP
* AES-256 Encryption for files
* Role-based authorization
* Secure HTTP headers (Helmet)
* Rate limiting for API protection

---

## 📡 API Modules

* Authentication APIs
* File Management APIs
* Admin Control APIs
* Activity Logging APIs

---

## 🚀 Deployment

| Service  | Platform                       |
| -------- | ------------------------------ |
| Frontend | Azure Static Web Apps / Vercel |
| Backend  | Azure App Service / Render     |
| Database | MongoDB Atlas                  |

---

## 📷 Screenshots

*Add screenshots here (Login, Dashboard, File Upload, etc.)*

---

## 📚 Future Enhancements

* File versioning
* Real-time notifications
* Drag-and-drop uploads
* Advanced analytics dashboard

---

## 👨‍💻 Author

**Vardhini Reddy**

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!
