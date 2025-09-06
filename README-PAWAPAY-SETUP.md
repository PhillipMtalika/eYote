# eYote Payment Integration with PawaPay v2 Payment Page

A modern, secure payment application built with Next.js 15 and TypeScript, integrating PawaPay's v2 Payment Page API for seamless mobile money payments.

## Features

- 🔐 **Secure Payment Processing** - Bank-level security with PawaPay
- 📱 **Mobile Money Integration** - Support for MTN, Airtel, Vodafone, and more
- 🌍 **Multi-Country Support** - Uganda, Ghana, and expanding
- ⚡ **Real-time Status Updates** - Live payment status tracking
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS
- 🔄 **Auto-refresh** - Automatic payment status polling

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# PawaPay API Configuration
PAWAPAY_BASE_URL=https://api.pawapay.cloud
PAWAPAY_API_TOKEN=your_pawapay_api_token_here

# Optional: For development/testing
NODE_ENV=development
```

### 3. Get PawaPay API Credentials

1. Visit [PawaPay](https://pawapay.cloud) and create an account
2. Complete the onboarding process
3. Get your API token from the dashboard
4. Add the token to your `.env.local` file

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── payments/route.ts      # Payment processing API
│   │   └── correspondents/route.ts # Mobile money providers API
│   ├── payment/page.tsx           # Payment page
│   └── page.tsx                   # Landing page
├── components/
│   ├── PaymentForm.tsx            # Payment form component
│   └── PaymentSuccess.tsx         # Payment status component
├── lib/
│   └── pawapay.ts                 # PawaPay service integration
└── types/
    └── payment.ts                 # TypeScript type definitions
```

## API Endpoints

### POST /api/payments
Initiate a new payment request.

**Request Body:**
```json
{
  "amount": 10.00,
  "phoneNumber": "+256701234567",
  "correspondent": "MTN_MOMO_UGA",
  "description": "Payment for services"
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "eyote_1234567890_abc123",
  "status": "ACCEPTED",
  "message": "Payment initiated successfully"
}
```

### GET /api/payments?paymentId={id}
Check payment status.

**Response:**
```json
{
  "success": true,
  "payment": {
    "paymentId": "eyote_1234567890_abc123",
    "status": "COMPLETED",
    "amount": "10.00",
    "currency": "USD",
    "correspondent": "MTN_MOMO_UGA",
    "payer": {
      "type": "MSISDN",
      "address": {
        "value": "256701234567"
      }
    },
    "created": "2024-01-01T12:00:00Z",
    "statementDescription": "Payment for services"
  }
}
```

### GET /api/correspondents
Get available mobile money providers.

**Response:**
```json
{
  "success": true,
  "correspondents": [
    {
      "correspondent": "MTN_MOMO_UGA",
      "country": "UGA",
      "currency": "UGX",
      "corridorId": "mtn-uganda",
      "name": "MTN Mobile Money Uganda"
    }
  ]
}
```

## Supported Mobile Money Providers

- **MTN Mobile Money** (Uganda, Ghana)
- **Airtel Money** (Uganda)
- **Vodafone Cash** (Ghana)
- More providers coming soon...

## Payment Flow

1. **User Input** - Customer enters payment details
2. **Validation** - Form validation and phone number formatting
3. **API Request** - Payment request sent to PawaPay
4. **Status Tracking** - Real-time status updates
5. **Completion** - Success/failure notification

## Security Features

- Environment variable protection for API keys
- Input validation and sanitization
- Secure API communication with PawaPay
- Error handling and user feedback
- Phone number format validation

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Deployment

### Environment Variables for Production

Ensure these environment variables are set in your production environment:

- `PAWAPAY_BASE_URL`
- `PAWAPAY_API_TOKEN`
- `NODE_ENV=production`

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Troubleshooting

### Common Issues

1. **"Payment initiation failed"**
   - Check your PawaPay API token
   - Verify the API base URL
   - Ensure your account has sufficient balance

2. **"Invalid phone number format"**
   - Phone numbers should include country code
   - Format: +256701234567 (Uganda example)

3. **"Failed to get correspondents"**
   - Check API credentials
   - Verify network connectivity
   - Falls back to mock data in development

### Debug Mode

Set `NODE_ENV=development` to see detailed error messages and use mock data when API calls fail.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support with PawaPay integration, visit [PawaPay Documentation](https://docs.pawapay.cloud) or contact their support team.

For application issues, please create an issue in this repository.
