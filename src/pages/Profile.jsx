import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";
import { app } from "../firebaseConfig";

const auth = getAuth(app);
const db = getFirestore(app);

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [role, setRole] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setDetails({
            fullName: data.fullName || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
          });
          setRole(data.role || "");
        }
      }
      setLoading(false);
    };

    fetchUserDetails();
  }, []);

  const handleChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          fullName: details.fullName,
          phone: details.phone,
          address: details.address,
        });
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 mt-4 bg-blue-200 dark:bg-pink-200">
        Test:{" "}
        {document.documentElement.classList.contains("dark")
          ? "Dark is active"
          : "Light is active"}
      </div>  
      <Navbar role={role} setRole={setRole} />
      <main className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="px-4 py-6 bg-white shadow sm:rounded-lg sm:px-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Profile</h2>
          {!isEditing ? (
            <div>
              <p>
                <strong>Full Name:</strong> {details.fullName}
              </p>
              <p>
                <strong>Email:</strong> {details.email}
              </p>
              <p>
                <strong>Phone:</strong> {details.phone}
              </p>
              <p>
                <strong>Address:</strong> {details.address}
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={details.fullName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={details.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={details.address}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
