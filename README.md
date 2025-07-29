# 📘 Garaadsom Book Portal

A comprehensive bookkeeping system for tracking weekly transactions with user management and role-based access control.

## 🚀 Features

### 👑 Admin Features

- Create and manage weekly book periods
- Create and manage users (create, ban, remove)
- View total books (active, inactive, closed)
- View user statistics (active, banned, removed)
- View action history (book creation, user changes)
- Monitor all transactions across users

### 👤 User Features

- View only active books
- Add daily transactions (gained, spent)
- Edit or remove own transactions
- View personal transaction summary and statistics
- Track gains and spending per active book

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: MySQL with Prisma ORM
- **Authentication**: Better Auth with JWT
- **UI**: shadcn/ui components with Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

## 📋 Prerequisites

- Node.js 18+
- MySQL database
- npm or yarn

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd garaadsom-book-shop
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

Make sure you have MySQL running locally without password (or update the connection string in `.env`).

### 4. Set up environment variables

The `.env` file should already be created with:

```
DATABASE_URL="mysql://root@localhost:3306/garaadsom_bookshop"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Create the database

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS garaadsom_bookshop;"
```

### 6. Run database migrations

```bash
npx prisma migrate dev --name init
```

### 7. Set up initial data

```bash
node scripts/setup-db.js
```

### 8. Start the development server

```bash
npm run dev
```

### 9. Access the application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Default Login

After running the setup script, you can login with:

- **Username**: `admin`
- **Password**: `admin123`

## 📊 Database Schema

### Users

- `id`: Unique identifier
- `username`: Unique username
- `name`: Full name
- `email`: Email address
- `passwordHash`: Hashed password
- `role`: ADMIN or USER
- `status`: ACTIVE, BANNED, or REMOVED

### Books

- `id`: Unique identifier
- `title`: Book title (format: "Week [number] of [Month] - [Month] - [Year]")
- `startDate`: Start date of the book period
- `endDate`: End date of the book period
- `durationDays`: Number of days
- `status`: ACTIVE, INACTIVE, or CLOSED
- `createdBy`: ID of the user who created the book

### Transactions

- `id`: Unique identifier
- `userId`: ID of the user who made the transaction
- `bookId`: ID of the book the transaction belongs to
- `transactionDate`: Date of the transaction
- `amountGained`: Amount gained (default: 0)
- `amountSpent`: Amount spent (default: 0)
- `note`: Optional note about the transaction

### Action Logs

- `id`: Unique identifier
- `actorId`: ID of the user who performed the action
- `actionType`: Type of action performed
- `targetType`: Type of target (BOOK, USER, TRANSACTION)
- `targetId`: ID of the target
- `details`: Additional details about the action

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/[...nextauth]` - Authentication endpoints

### Books

- `GET /api/books` - Get all books (with optional status filter)
- `POST /api/books` - Create a new book (admin only)

### Transactions

- `GET /api/transactions` - Get transactions (filtered by user/book)
- `POST /api/transactions` - Create a new transaction

## 📝 Usage

### For Admins

1. **Create Books**: Navigate to Books → Create New Book
2. **Manage Users**: Navigate to Users to view and manage user accounts
3. **View History**: Check the History page for system action logs
4. **Monitor Transactions**: View all transactions across users

### For Users

1. **View Active Book**: Check the dashboard for current active book
2. **Add Transactions**: Navigate to Transactions → Add Transaction
3. **Track Progress**: View your transaction history and statistics
4. **Edit Transactions**: Modify or remove your own transactions

## 🎨 UI Components

The application uses shadcn/ui components for a consistent and modern interface:

- Cards for content organization
- Tables for data display
- Forms with validation
- Badges for status indicators
- Buttons with various styles
- Navigation with responsive design

## 🔒 Security Features

- Role-based access control
- Password hashing with bcrypt
- JWT-based authentication
- Input validation with Zod
- SQL injection protection via Prisma
- Action logging for audit trails

## 🚀 Deployment

### Environment Variables

Make sure to set the following environment variables in production:

- `DATABASE_URL`: Your production database URL
- `NEXTAUTH_SECRET`: A strong secret key
- `NEXTAUTH_URL`: Your production URL

### Build and Deploy

```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions, please open an issue in the repository.
