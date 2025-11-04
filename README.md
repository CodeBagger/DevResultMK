# Scheduler App

A modern, responsive scheduling application built with React and TypeScript. Features calendar views for day, week, and month with full event management capabilities.

## Features

- 📅 **Multiple Calendar Views**: Day, Week, and Month views
- ✏️ **Event Management**: Create, edit, and delete events
- 🎨 **Customizable Events**: Color-coded events with descriptions
- 💾 **Local Storage**: Events persist in browser storage
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🎯 **Modern UI**: Beautiful, intuitive interface

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.

## AWS Deployment

This application is designed to be deployed to AWS S3 with CloudFront for optimal performance.

### Deployment Steps

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Create an S3 bucket** for hosting the static files

3. **Upload the build folder** contents to your S3 bucket

4. **Configure CloudFront** for global distribution and HTTPS

5. **Set up Route 53** for custom domain (optional)

### AWS Infrastructure

The application can be deployed using:
- **S3**: Static website hosting
- **CloudFront**: CDN for global distribution
- **Route 53**: DNS management (optional)
- **ACM**: SSL certificate management

## Usage

### Creating Events

1. Click on any date in the calendar
2. Fill in the event details:
   - Title (required)
   - Start and end times
   - Description (optional)
   - Color (optional)
3. Click "Save" to create the event

### Managing Events

- **Edit**: Click on an existing event to modify it
- **Delete**: Open an event and click the "Delete" button
- **View**: Events are displayed in their respective time slots

### Calendar Views

- **Day View**: Shows a single day with hourly slots
- **Week View**: Shows a full week (Sunday to Saturday)
- **Month View**: Shows the entire month with all events

## Technology Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **date-fns**: Date manipulation library
- **Lucide React**: Beautiful icons
- **CSS3**: Modern styling with flexbox and grid

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
