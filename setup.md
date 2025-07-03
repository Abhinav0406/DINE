# 🚀 DINE+ Restaurant Management System - Setup Guide

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account (free tier available)

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../dine-plus-frontend
npm install
```

### 2. Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. In your Supabase dashboard, go to SQL Editor
4. Copy and paste the contents of `backend/src/db/schema.sql`
5. Execute the script to create all tables and sample data

### 3. Environment Configuration

**Backend Environment (.env)**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Frontend Environment (.env)**
```bash
cd dine-plus-frontend
cp .env.example .env
```

Edit `dine-plus-frontend/.env`:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=http://localhost:4000/api
```

### 4. Start the Application

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**
```bash
cd dine-plus-frontend
npm start
```

### 5. Access the Application

- **Customer Interface**: http://localhost:3000
- **Kitchen Dashboard**: http://localhost:3000/kitchen
- **Admin Dashboard**: http://localhost:3000/admin
- **Backend API**: http://localhost:4000

## 🎯 Application Flow

### Customer Journey
1. **Table Selection** (`/tables`) - Choose available table
2. **Menu Browsing** (`/menu`) - Browse and add items to cart
3. **Cart Review** (`/cart`) - Review order and add special instructions
4. **Payment** (`/payment`) - Select payment method and pay
5. **Order Tracking** (`/order-status/:id`) - Real-time order status
6. **Feedback** (`/feedback/:id`) - Rate the experience

### Kitchen Interface (`/kitchen`)
- View incoming orders in real-time
- Update order status (pending → preparing → ready → served)
- Filter orders by status and date
- Audio notifications for new orders

### Admin Interface (`/admin`)
- Revenue analytics and reporting
- Order management and monitoring
- Customer feedback analysis
- Table occupancy statistics

## 🛠️ Database Schema

The system includes these main tables:
- `users` - Customer and staff profiles
- `restaurants` - Restaurant information
- `tables` - Table management
- `menu_categories` - Menu organization
- `menu_items` - Complete menu catalog
- `orders` - Order management
- `order_items` - Order line items
- `feedback` - Customer reviews

## 🔧 Key Features

### Real-time Updates
- Orders sync instantly across all interfaces
- Kitchen gets immediate notifications
- Customers see live order progress

### State Management
- Zustand store for client-side state
- Persistent cart and user sessions
- Optimistic UI updates

### Responsive Design
- Mobile-first approach
- Clean, modern UI with Tailwind CSS
- Accessible components

### Payment Integration
- Multiple payment method support
- Secure payment processing simulation
- Order confirmation and tracking

## 📱 Sample Data

The system comes with pre-populated sample data:
- 8 restaurant tables with different capacities
- 15+ menu items across 5 categories
- Pricing from ₹35 to ₹425
- Vegetarian, vegan, and spicy indicators

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify Supabase URL and keys are correct
   - Check if RLS policies are properly set up
   - Ensure schema.sql was executed successfully

2. **CORS Issues**
   - Verify CORS_ORIGIN in backend .env
   - Check if frontend is running on the correct port

3. **Module Not Found Errors**
   - Run `npm install` in both directories
   - Clear npm cache: `npm cache clean --force`

4. **Build Errors**
   - Check Node.js version (should be v16+)
   - Verify all environment variables are set

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload
2. **API Testing**: Use the health check endpoint: `GET /health`
3. **Database**: Monitor queries in Supabase dashboard
4. **Logs**: Check browser console and terminal for errors

## 📈 Production Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `build` folder
3. Set environment variables in deployment platform

### Backend (Railway/Heroku)
1. Set all environment variables
2. Deploy using platform's CLI or Git integration
3. Update CORS_ORIGIN to match frontend domain

### Database
- Supabase handles production database automatically
- Consider upgrading to paid plan for production use

## 🎨 Customization

### Styling
- Edit `tailwind.config.js` for design system changes
- Modify component styles in individual files
- Add custom CSS classes in `src/index.css`

### Menu Data
- Update `src/data/menuData.ts` for menu items
- Add food images to `public/images/` directory
- Modify categories and pricing as needed

### Features
- Add new pages in `src/pages/`
- Create reusable components in `src/components/`
- Extend API routes in `backend/src/routes/`

## 📞 Support

For issues or questions:
1. Check this setup guide first
2. Review the code comments and documentation
3. Test with sample data to isolate issues
4. Verify environment variables and database setup

Happy coding! 🍽️✨ 