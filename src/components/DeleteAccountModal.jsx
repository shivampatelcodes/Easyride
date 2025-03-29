import  { useState } from "react";
import PropTypes from "prop-types";

const DeleteAccountModal = ({ isOpen, onCancel, onDelete, userEmail }) => {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  if (!isOpen) return null;

  const handleDelete = () => {
    if (emailInput !== userEmail) {
      alert("The email does not match your account email. Please try again.");
      return;
    }
    if (!passwordInput) {
      alert("Please enter your password.");
      return;
    }
    onDelete({ email: emailInput, password: passwordInput });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-md shadow-md max-w-sm w-full">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Confirm Account Deletion
        </h2>
        <p className="mb-4 text-gray-900">
          To permanently delete your account and all related data, please type
          your email and password below.
        </p>
        <input
          type="text"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="Type your email here"
          className="w-full px-3 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
        <input
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="Enter your password"
          className="w-full px-3 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-700"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

DeleteAccountModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  userEmail: PropTypes.string.isRequired,
};

export default DeleteAccountModal;
