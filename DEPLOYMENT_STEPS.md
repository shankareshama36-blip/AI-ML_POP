# Praxis — Clerk Authentication Cloud Deployment Checklist

Follow these step-by-step instructions to complete the Clerk authentication configuration in your **Render** and **Clerk** dashboards.

---

## Step 1: Configure Render Backend Environment Variables

1. Log in to the [Render Dashboard](https://dashboard.render.com/).
2. Select your **Backend Web Service** (e.g., `praxis-backend-r4tp` or `am-pop-backend`).
3. In the left sidebar, click **Environment**.
4. Under **Environment Variables**, click **Add Environment Variable** and add the following keys:
   - **Key**: `CLERK_SECRET_KEY`  
     **Value**: `sk_test_77KcmEDXlkGMj5gRP80zm4awZs1vlRuJ3wnLY6mkpY`
   - **Key**: `CLERK_PUBLISHABLE_KEY`  
     **Value**: `pk_test_Y3Jpc3AtdHJvbGwtNDc5Ni5jbGVyay5hY2NvdW50cy5kZXYk`
   - **Key**: `ENABLE_DEMO_ACCOUNTS`  
     **Value**: `true`
5. Click **Save Changes**. Render will automatically restart/redeploy the backend service with the new environment variables.

---

## Step 2: Configure Render Frontend Environment Variables & Deploy

1. Return to the [Render Dashboard](https://dashboard.render.com/) and select your **Frontend Static Site** (`praxis-frontend-r4tp`).
2. In the left sidebar, click **Environment**.
3. Under **Environment Variables**, click **Add Environment Variable**:
   - **Key**: `VITE_CLERK_PUBLISHABLE_KEY`  
     **Value**: `pk_test_Y3Jpc3AtdHJvbGwtNDc5Ni5jbGVyay5hY2NvdW50cy5kZXYk`
4. Click **Save Changes**.
5. Because Vite bundles environment variables at build time for static sites, trigger a fresh build:
   - Click the **Manual Deploy** button in the top-right corner of the service page.
   - Select **Clear build cache & deploy** (or **Deploy latest commit**).
   - Wait for the build and publish steps to finish (`Live`).

---

## Step 3: Configure Clerk Webhooks (`user.created`)

1. Open the [Clerk Dashboard](https://dashboard.clerk.com/) and select your Praxis application.
2. In the left navigation menu, go to **Configure** -> **Webhooks**.
3. Click **+ Add Endpoint**.
4. In the **Endpoint URL** field, enter your Render backend webhook URL:
   ```text
   https://praxis-backend-r4tp.onrender.com/webhooks/clerk
   ```
   *(Note: If your backend service uses a different Render subdomain such as `https://am-pop-backend.onrender.com`, use `<your-backend-url>/webhooks/clerk`).*
5. Under **Message Filtering / Subscribe to events**, search for and check:
   - `user.created` (Required — automatically provisions a multi-tenant workspace and default role in PostgreSQL when a user signs up)
   - `user.updated` (Optional — syncs role updates)
6. Click **Create**.
7. On the endpoint details page, locate the **Signing Secret** on the right-hand side (it starts with `whsec_...`) and click the eye/copy icon to copy it.
8. Go back to your **Render Backend Service** -> **Environment**:
   - Add (or update) the environment variable:
     - **Key**: `CLERK_WEBHOOK_SECRET`
     - **Value**: *(Paste your `whsec_...` Signing Secret here)*
   - Click **Save Changes**.

---

## Step 4: Verify Production Setup

1. Open [https://praxis-frontend-r4tp.onrender.com](https://praxis-frontend-r4tp.onrender.com).
2. Confirm the **Hero Landing Page** loads first.
3. Click **Sign In**:
   - Test **"🚀 Use Demo Account (Bypass Clerk)"** to verify instant 1-click demo access works.
   - Test signing up / signing in via the **Clerk `<SignIn />` / `<SignUp />` component** to verify Clerk JWT authentication and workspace provisioning.
