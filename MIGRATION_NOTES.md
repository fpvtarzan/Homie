# Migration: Twilio → WhatsApp Cloud API

## What Changed

### 1. Webhook Format

**Twilio → Meta comparison:**

| Aspect | Twilio | Meta |
|--------|--------|------|
| Body Format | TwiML XML response | JSON POST back to Meta |
| Message field | `Body` | `message.text.body` |
| Sender field | `From` | `message.from` |
| Sender name | `ProfileName` | `contact.profile.name` |
| Signature header | `X-Twilio-Signature` | `X-Hub-Signature-256` |
| Signature algorithm | Custom (Twilio specific) | HMAC SHA256 |

**Old Twilio webhook handler:**
```typescript
router.post('/', validateTwilioSignature, async (req: Request, res: Response) => {
  const { From, Body, ProfileName } = req.body;
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(response);
  res.type('text/xml').send(twiml.toString());
});
```

**New Meta webhook handler:**
```typescript
router.post('/', validateMetaSignature, async (req: Request, res: Response) => {
  const message = req.body.entry[0].changes[0].value.messages[0];
  const { from, text: { body: messageText } } = message;
  await sendWhatsAppMessage(from, response);
  res.status(200).json({ received: true });
});
```

### 2. Message Sending

**Twilio:**
```typescript
const client = twilio(accountSid, authToken);
await client.messages.create({
  body: message,
  from: 'whatsapp:+14155238886',
  to: 'whatsapp:+1234567890'
});
```

**Meta:**
```typescript
const url = `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`;
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    messaging_product: 'whatsapp',
    to: '1234567890', // Just the number, no prefix
    type: 'text',
    text: { body: message }
  })
});
```

### 3. Signature Validation

**Twilio:**
```typescript
const isValid = twilio.validateRequest(authToken, signature, url, params);
```

**Meta:**
```typescript
const hash = crypto
  .createHmac('sha256', appSecret)
  .update(rawBody)
  .digest('hex');
const expectedSignature = `sha256=${hash}`;
return signature === expectedSignature;
```

### 4. Environment Variables

**Old (Twilio):**
```env
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=whatsapp:+xxx
```

**New (Meta):**
```env
WHATSAPP_PHONE_NUMBER_ID=102345678901234
WHATSAPP_ACCESS_TOKEN=EAABa5ZCvB2c0BA...
WHATSAPP_APP_SECRET=a1b2c3d4e5f6...
WHATSAPP_VERIFY_TOKEN=custom_token_you_create
```

### 5. Dependencies

**Removed:**
- `twilio` package (no longer needed)

**Kept:**
- `express` (for HTTP server)
- `dotenv` (for env vars)
- Built-in `fetch` API (Node 18+) and `crypto` module

## Files Modified

1. **src/routes/webhook.ts**
   - Replaced Twilio validation middleware with Meta validation
   - Changed webhook POST handler to parse Meta format
   - Added GET handler for webhook verification
   - Changed response format from TwiML XML to JSON

2. **src/utils/twilio.ts** (kept name for now, but refactored)
   - Removed Twilio client initialization
   - Replaced with Meta API endpoint calls
   - Updated signature validation for HMAC SHA256
   - Changed message sending to use fetch API

3. **.env.example**
   - Replaced Twilio variables with Meta variables
   - Added `WHATSAPP_VERIFY_TOKEN`

4. **package.json**
   - Removed `twilio` from dependencies

## Testing the Migration

### Quick Test with curl

```bash
# Test webhook is accessible
curl http://localhost:3000/webhook

# Test message webhook (locally, no signature validation)
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "field": "messages",
        "value": {
          "messages": [{
            "from": "1234567890",
            "text": { "body": "hello" }
          }],
          "contacts": [{
            "profile": { "name": "Test User" }
          }]
        }
      }]
    }]
  }'
```

### Run Build & Tests

```bash
npm run build     # Should pass with no errors
npm run dev       # Should start server without errors
```

## Key Differences to Be Aware Of

1. **Response Method**
   - Twilio: Synchronous response via TwiML XML
   - Meta: Asynchronous via separate API call

2. **Rate Limits**
   - Twilio: Per-account limits
   - Meta: 1,000/day free tier (can increase)

3. **Phone Number Format**
   - Twilio: `whatsapp:+1234567890` with prefix
   - Meta: Just the digits `1234567890`

4. **Webhook Verification**
   - Twilio: Only POST messages, GET not used for verification
   - Meta: GET used for initial webhook verification (required!)

5. **Error Handling**
   - Twilio: Retries if TwiML not sent
   - Meta: Retries based on status field (we always return 200 OK)

## Backward Compatibility

None. This is a complete replacement. Old Twilio endpoints/logic are completely removed.

## Future Enhancements

With Meta's Cloud API, you can now:

1. **Send media** (images, documents, videos)
   ```typescript
   // Not yet implemented, but easily added
   type: 'image',
   image: { link: 'https://example.com/image.jpg' }
   ```

2. **Use message templates** (for compliance with frequency rules)
   ```typescript
   type: 'template',
   template: { name: 'hello_world', language: { code: 'en' } }
   ```

3. **Track message status** (via webhook events)
   ```typescript
   // Subscribe to message_status field in webhook
   message.status // 'sent', 'delivered', 'read', 'failed'
   ```

4. **Interactive messages** (buttons, lists)
   ```typescript
   type: 'interactive',
   interactive: { type: 'button', body: {...}, action: {...} }
   ```

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `403 Forbidden` on webhook POST | Signature validation failed | Check app secret matches |
| `401 Unauthorized` when sending | Access token invalid/expired | Regenerate token in Meta |
| Bot doesn't respond | Server not running or URL misconfigured | Check webhook URL in Meta matches server |
| Webhook not verified by Meta | Verify token mismatch | Double-check token in .env and Meta dashboard |
| Message field not found | Webhook format changed | Check Meta docs for latest message schema |

## Rollback

If you need to go back to Twilio:

1. Revert these files:
   - `src/routes/webhook.ts`
   - `src/utils/twilio.ts`
   - `.env.example`
   - `package.json`

2. Restore Twilio dependencies:
   ```bash
   npm install twilio@^5.12.2
   ```

3. Restore old environment variables in `.env`

4. Run `npm run build` and restart server

## References

- [Meta WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [Webhook Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-example)
- [API Comparison](https://www.twilio.com/docs/whatsapp/migration-guide) (Twilio migration guide)
