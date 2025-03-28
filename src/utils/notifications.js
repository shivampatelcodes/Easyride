import emailjs from "emailjs-com";

// Sends an email when a ride request is received
export const sendRideRequestEmail = (rideRequestData) => {
  const templateParams = {
    to_email: rideRequestData.passengerEmail, // Passenger's email address
    ride_id: rideRequestData.rideId, // Ride identifier
    origin: rideRequestData.origin,
    destination: rideRequestData.destination,
  };

  emailjs
    .send(
      "service_an0ii9i", // Service ID
      "template_5htruxe", // Template ID for ride request
      templateParams,
      "lgKfBRP3kg2le_Ekq" // Your public key
    )
    .then(
      (result) => {
        console.log("Ride request email sent:", result.text);
      },
      (error) => {
        console.error("Failed to send ride request email:", error.text);
      }
    );
};

// Sends an email when a ride request is accepted by the driver
export const sendRideAcceptedEmail = (rideAcceptData) => {
  if (
    !rideAcceptData.passengerEmail ||
    rideAcceptData.passengerEmail.trim() === ""
  ) {
    console.error(
      "No recipient email provided in rideAcceptData:",
      rideAcceptData
    );
    return;
  }
  const templateParams = {
    to_email: rideAcceptData.passengerEmail, // Make sure this exactly matches your EmailJS template variable
    ride_id: rideAcceptData.rideId, // Ride identifier
  };

  console.log("Template Parameters:", templateParams); // debug log

  emailjs
    .send(
      "service_an0ii9i", // Service ID
      "template_911i8bj", // Template ID for ride accepted
      templateParams,
      "lgKfBRP3kg2le_Ekq" // Your public key
    )
    .then(
      (result) => {
        console.log("Ride accepted email sent:", result.text);
      },
      (error) => {
        console.error("Failed to send ride accepted email:", error.text);
      }
    );
};
