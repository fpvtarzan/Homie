# Railway Deployment Guide - Homie WhatsApp Bot

This guide covers deploying the Homie WhatsApp travel guide bot to Railway.

## Prerequisites

- [Railway CLI](https://docs.railway.app/develop/cli) installed
- Railway account created at https://railway.app
- Meta WhatsApp Cloud API credentials ready (Phone Number ID, Access Token, App Secret, Verify Token)
- Your domain name or Railway's public URL for webhook

## Deployment Steps

### 1. Install Railway CLI

```bash
npm i -g @railway/cli
```

### 2. Login to Railway

```bash
railway login
```

This opens your browser to authenticate. Follow the prompts.

### 3. Create or Link Railway Project

**For a new project:**
```bash
railway init
```

Select "Node.js" when prompted, name your project (e.g., "homie-bot"), and confirm.

**For an existing project:**
```bash
railway link <project-id>
```

### 4. Set Environment Variables

In Railway dashboard or via CLI:

```bash
railway variables set WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
railway variables set WHATSAPP_ACCESS_TOKEN="your_access_token"
railway variables set WHATSAPP_APP_SECRET="your_app_secret"
railway variables set WHATSAPP_VERIFY_TOKEN="your_verify_token"
railway variables set NODE_ENV="production"
railway variables set ANTHROPIC_API_KEY="your_claude_api_key"
```

Or set them in the Railway dashboard:
1. Go to your project
2. Click "Variables"
3. Add each variable as a key-value pair
4. **Do NOT commit these to git** — set them only in Railway's dashboard

### 5. Deploy

```bash
railway up
```

Or if you have a Git repository:

```bash
git add .
git commit -m "Add Railway deployment configuration"
git push
```

Railway will automatically detect the Dockerfile and build/deploy.

### 6. Get Your Public URL

After deployment completes:

```bash
railway open
```

This opens the Railway dashboard. You'll see your service URL (e.g., `https://homie-bot-production.up.railway.app`).

Or via CLI:
```bash
railway variables
```

Look for the `RAILWAY_PUBLIC_DOMAIN` variable.

### 7. Update Meta Webhook Configuration

1. Go to [Meta App Dashboard](https://developers.facebook.com/apps)
2. Select your WhatsApp app
3. Navigate to **WhatsApp > Configuration**
4. Update the Webhook URL to:
   ```
   https://<your-railway-domain>/webhook
   ```
5. Keep the Verify Token the same (it should match `WHATSAPP_VERIFY_TOKEN`)
6. Save changes

### 8. Verify Deployment

Test your bot with these endpoints:

**Health Check:**
```bash
curl https://<your-railway-domain>/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-14T12:00:00.000Z",
  "environment": "production"
}
```

**Root Endpoint:**
```bash
curl https://<your-railway-domain>/
```

Expected response:
```json
{
  "service": "Homie WhatsApp Travel Guide Bot",
  "version": "1.0.0",
  "status": "running"
}
```

**Send a Test Message:**
Use Meta's webhook test tool or send a message via WhatsApp to your bot number. Check Railway logs:
```bash
railway logs -f
```

## Monitoring & Logs

### View Logs

```bash
railway logs -f
```

### View Metrics

In Railway dashboard:
1. Select your service
2. Click "Deployments" to see build/deployment history
3. View CPU, memory, and network usage
4. Check for errors or warnings

### Restart Service

```bash
railway redeploy
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `WHATSAPP_PHONE_NUMBER_ID` | Your WhatsApp business phone number ID | `120000000000000` |
| `WHATSAPP_ACCESS_TOKEN` | Meta API access token | `EAAxxxxxxxxxxxxxx` |
| `WHATSAPP_APP_SECRET` | Your app's secret key | `a1b2c3d4e5f6` |
| `WHATSAPP_VERIFY_TOKEN` | Custom webhook verify token | `your_secret_token` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (Railway sets automatically) | `3000` |
| `ANTHROPIC_API_KEY` | Claude API key for AgentDB | `sk-ant-xxxxx` |

## Troubleshooting

### Build Fails

Check build logs in Railway dashboard. Common issues:
- Missing `package-lock.json` — run `npm install` locally
- TypeScript errors — run `npm run build` locally to verify
- Missing dependencies — ensure all imports are in `package.json`

### Webhook Not Receiving Messages

1. Verify webhook URL is correctly configured in Meta dashboard
2. Check that `WHATSAPP_VERIFY_TOKEN` matches your Meta config
3. View logs: `railway logs -f` and send a test message
4. Ensure your service is healthy: `curl https://<your-domain>/health`

### High Memory Usage

- Check if activities.json is being loaded multiple times
- Review logs for memory leaks
- Restart service: `railway redeploy`
- Consider Railway's memory allocation in service settings

### Deployment Rollback

View deployment history and rollback:
```bash
railway logs --service <service-id> -f
```

In Railway dashboard, go to "Deployments" and click "Rollback" on a previous successful deployment.

## Local Testing Before Deployment

Test the Docker build locally:

```bash
docker build -t homie-bot .
docker run -p 3000:3000 \
  -e WHATSAPP_PHONE_NUMBER_ID="test" \
  -e WHATSAPP_ACCESS_TOKEN="test" \
  -e WHATSAPP_APP_SECRET="test" \
  -e WHATSAPP_VERIFY_TOKEN="test" \
  -e NODE_ENV="production" \
  homie-bot
```

Test endpoints:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/
```

## Additional Resources

- [Railway Docs](https://docs.railway.app)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)
- [Meta WhatsApp API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Express.js Docs](https://expressjs.com)

## Support

For Railway issues, visit: https://railway.app/support
For WhatsApp API issues, visit: https://developers.facebook.com/support
