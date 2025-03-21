# EasyRide 🚗

EasyRide is a ride-sharing platform connecting passengers and drivers using React and Firebase. It allows users to sign up as either drivers or passengers, book rides, manage bookings, and update their profiles. The application leverages Firebase Authentication and Firestore for secure user management and real-time data updates.

## Project Overview

EasyRide is designed to provide a seamless ride-sharing experience with the following key features:

- **User Authentication:**  
  Users can sign up and log in using their email and password. Firebase Authentication is used to manage user sessions and ensure persistent login across sessions.

- **Role-Based Access:**  
  Users register either as drivers or passengers. Drivers can post trips and manage bookings, while passengers can search for available rides and make reservations.

- **Profile Management:**  
  Users can update their profile information including full name, phone number, and address. The app checks for profile completeness to ensure all required fields are filled before accessing sensitive areas such as the dashboard.

- **Ride and Booking Management:**

  - Drivers can post trips with necessary details such as origin, destination, date, and available seats.
  - Passengers can search for trips that match their criteria and book rides.
  - Real-time data is managed using Firestore’s onSnapshot listeners for immediate updates.

- **Responsive Design:**  
  The application is built with a mobile-first approach using Tailwind CSS to ensure a responsive and modern user interface.

## Build and Run Instructions

Follow these steps to set up and run the EasyRide project on your machine:

1. **Clone the Repository:**

   ```sh
   git clone https://github.com/your-username/easyride.git
   cd easyride
   ```

2. **Install Dependencies:**

   ```sh
   npm install
   ```

3. **Setup Firebase Configuration:**

   - Create a `.env` file in the root directory.
   - Add your Firebase configuration variables to the `.env` file as shown below:
     ```env
     VITE_FIREBASE_API_KEY=your-api-key
     VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
     VITE_FIREBASE_PROJECT_ID=your-project-id
     VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
     VITE_FIREBASE_APP_ID=your-app-id
     VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
     ```

4. **Start the Development Server:**

   ```sh
   npm run dev
   ```

5. **Build the Application for Production:**

   ```sh
   npm run build
   ```

6. **Preview the Production Build:**
   ```sh
   npm run preview
   ```

## Technologies Used

- **Frontend:**

  - [React](https://reactjs.org/): For building the user interface.
  - [React Router](https://reactrouter.com/): For client-side routing.
  - [Tailwind CSS](https://tailwindcss.com/): For fast and responsive styling.
  - [PropTypes](https://www.npmjs.com/package/prop-types): For prop type validation in React components.

- **Backend:**
  - [Firebase Authentication](https://firebase.google.com/docs/auth): For managing user sign up/sign in and maintaining persistent sessions.
  - [Firestore](https://firebase.google.com/docs/firestore): For storing app data, including user profiles, trips, and booking details.
  - _Optional:_ [Firebase Functions](https://firebase.google.com/docs/functions): For hosting server-side logic if needed.

## License

The MIT License was chosen because it’s simple, widely recognized, and allows others to freely use and contribute to the project. For full details, please see the [LICENSE](LICENSE.md) file.

---

Happy coding!
