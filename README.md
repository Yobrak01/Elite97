# ELITE97 STUDY SYSTEM

An AI-powered academic performance operating system designed specifically for engineering students to optimize focus, manage workload intensity, prevent academic burnout, and maintain highly structured discipline streaks.

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT, BcryptJS, Helmet, Express-Rate-Limit
- **Frontend**: React (Vite), React Router v6, Tailwind CSS, Recharts, Lucide-React
- **Database**: MongoDB Atlas compatible
- **Deployment Ready**: Render Blueprint & Vercel SPA Configs included

---

## 🚀 Local Installation & Execution

### 1. Backend Setup
1. Open a terminal in `backend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the environment:
   Open the `.env` file and replace the `MONGO_URI` with your own MongoDB Atlas connection string.
4. Run in development mode:
   ```bash
   npm run dev
   ```
   The backend server will launch on `http://localhost:5000`.

### 2. Frontend Setup
1. Open a new terminal in `frontend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000`. Open your browser and navigate to `http://localhost:3000`.

---

## ☁️ Deployment Instructions

### 1. Backend Deployment (Render)
1. Push the entire codebase to a GitHub repository.
2. In the Render Dashboard, click **New +** and select **Blueprint**.
3. Link your GitHub repository. Render will automatically parse the `backend/render.yaml` configuration.
4. Render will prompt you to provide the `MONGO_URI` environment variable. Paste your production MongoDB Atlas cluster URI.
5. Under settings, configure the environment variables:
   - `JWT_SECRET`: A secure unique random string.
   - `NODE_ENV`: `production`.
6. Click deploy. Render will compile and host your API service.

### 2. Frontend Deployment (Vercel)
1. In the Vercel Dashboard, click **Add New** and select **Project**.
2. Select your GitHub repository.
3. For the **Root Directory**, choose `frontend/`.
4. Vercel will automatically detect Vite and configure the build settings (`npm run build` and output `dist`).
5. Open the **Environment Variables** panel and add:
   - `VITE_API_URL`: Your hosted Render backend API URL (e.g., `https://your-backend.onrender.com/api`).
6. Click deploy. Vercel will host the sleek SPA at a secure URL.
