/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  limit,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { app } from "../firebaseConfig";

const db = getFirestore(app);
const auth = getAuth(app);

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [chatUsers, setChatUsers] = useState({});

  // This useEffect listens for auth state changes and refreshes chats when the user changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("Auth state changed, user logged in:", user.uid);
        fetchUserChats(user.uid);
      } else {
        console.log("Auth state changed, user logged out");
        setChats([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch all chats for a specific user
  const fetchUserChats = (userId) => {
    console.log("Fetching chats for user:", userId);
    setLoading(true);

    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("participants", "array-contains", userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`Got ${snapshot.docs.length} chats from Firestore`);
        const chatList = [];
        snapshot.forEach((doc) => {
          chatList.push({ id: doc.id, ...doc.data() });
        });

        // Sort chats by last message timestamp
        chatList.sort((a, b) => {
          const timeA = a.lastMessageAt?.seconds || a.createdAt?.seconds || 0;
          const timeB = b.lastMessageAt?.seconds || b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        console.log(`Fetched ${chatList.length} chats for user ${userId}`);
        setChats(chatList);
        setLoading(false);

        // Also fetch user info for each participant
        fetchChatParticipants(chatList);
      },
      (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  };

  // Fetch user info for all chat participants
  const fetchChatParticipants = async (chatList) => {
    const userIds = new Set();

    // Collect all unique user IDs
    chatList.forEach((chat) => {
      chat.participants.forEach((userId) => {
        if (userId !== auth.currentUser?.uid) {
          userIds.add(userId);
        }
      });
    });

    // Fetch user info for each ID
    const users = {};
    for (const userId of userIds) {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          users[userId] = {
            id: userId,
            ...userDoc.data(),
          };
        }
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
      }
    }

    setChatUsers(users);
  };

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChat) {
      setActiveMessages([]);
      return () => {};
    }

    console.log(`Loading messages for chat: ${activeChat}`);

    const messagesRef = collection(db, "chats", activeChat, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const messages = [];
        let hasUnreadMessages = false;

        snapshot.forEach((doc) => {
          const data = doc.data();
          const message = {
            id: doc.id,
            ...data,
            timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
          };
          messages.push(message);

          if (!data.read && data.senderId !== auth.currentUser?.uid) {
            hasUnreadMessages = true;
          }
        });

        console.log(
          `Fetched ${messages.length} messages for chat ${activeChat}`
        );
        setActiveMessages(messages);

        // If there are any unread messages, mark them as read:
        const user = auth.currentUser;
        if (!user) return;

        if (hasUnreadMessages) {
          // 1. Mark each unread message as read.
          const unreadMessages = messages.filter(
            (msg) => !msg.read && msg.senderId !== user.uid
          );

          for (const msg of unreadMessages) {
            try {
              await updateDoc(
                doc(db, "chats", activeChat, "messages", msg.id),
                {
                  read: true,
                }
              );
            } catch (error) {
              console.error(`Error marking message ${msg.id} as read:`, error);
            }
          }

          // 2. Update chat document to reflect that the last message has been read.
          if (unreadMessages.length > 0) {
            try {
              const chatDoc = await getDoc(doc(db, "chats", activeChat));
              if (chatDoc.exists()) {
                const chatData = chatDoc.data();
                // If last message was not sent by the current user, mark it read.
                if (
                  chatData.lastMessageSenderId &&
                  chatData.lastMessageSenderId !== user.uid
                ) {
                  await updateDoc(doc(db, "chats", activeChat), {
                    messagesRead: true,
                    lastReadAt: serverTimestamp(),
                  });
                  console.log("Updated chat document to mark messages as read");
                }
              }
            } catch (error) {
              console.error("Error updating chat document:", error);
            }
          }
        }
      },
      (error) => {
        console.error("Error fetching messages:", error);
      }
    );

    return () => unsubscribe();
  }, [activeChat]);

  // Start a new chat
  const startChat = async (rideId, otherUserId) => {
    console.log(
      `Starting chat - Ride ID: ${rideId}, Other User ID: ${otherUserId}`
    );
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user");
      return null;
    }

    try {
      // First, check if chat already exists between these users for this ride
      // Using a more specific query to avoid duplicate chats
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("rideId", "==", rideId),
        where("participants", "array-contains", user.uid)
      );

      console.log("Checking for existing chat");
      const querySnapshot = await getDocs(q);
      let chatId;

      // Check if any of the found chats has the other user as a participant
      if (!querySnapshot.empty) {
        for (const docSnapshot of querySnapshot.docs) {
          const chatData = docSnapshot.data();
          if (chatData.participants.includes(otherUserId)) {
            console.log("Chat already exists with ID:", docSnapshot.id);
            chatId = docSnapshot.id;
            break;
          }
        }
      }

      // If no existing chat was found, create a new one
      if (!chatId) {
        console.log("Creating new chat - fetching ride details");
        // Get ride details
        const rideRef = doc(db, "rides", rideId);
        const rideSnap = await getDoc(rideRef);

        if (!rideSnap.exists()) {
          console.error("Ride not found:", rideId);
          return null;
        }

        const rideData = rideSnap.data();
        console.log("Ride data retrieved:", rideData);

        // Create new chat
        const newChatRef = await addDoc(collection(db, "chats"), {
          rideId,
          rideDetails: {
            origin: rideData.origin,
            destination: rideData.destination,
            date: rideData.date,
          },
          participants: [user.uid, otherUserId],
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
        });

        console.log("New chat created with ID:", newChatRef.id);
        chatId = newChatRef.id;

        // Add a welcome system message
        await addDoc(collection(db, "chats", chatId, "messages"), {
          content:
            "Chat started! You can now exchange messages about this ride.",
          senderId: "system",
          timestamp: serverTimestamp(),
          read: false,
        });
      }

      return chatId;
    } catch (error) {
      console.error("Error starting chat:", error);
      return null;
    }
  };

  // Update the sendMessage function to reset the messagesRead flag:
  const sendMessage = async (chatId, content) => {
    const user = auth.currentUser;
    if (!user) {
      console.error("Cannot send message: No authenticated user");
      return;
    }
    if (!content.trim()) {
      console.error("Cannot send empty message");
      return;
    }

    console.log(
      `Sending message in chat ${chatId} by user ${
        user.uid
      }: ${content.substring(0, 20)}...`
    );

    try {
      // Ensure the chat document exists.
      const chatDoc = await getDoc(doc(db, "chats", chatId));
      if (!chatDoc.exists()) {
        console.error("Chat not found");
        return;
      }

      // Add a new message.
      const messageData = {
        content,
        senderId: user.uid,
        timestamp: serverTimestamp(),
        read: false,
      };

      const messageRef = await addDoc(
        collection(db, "chats", chatId, "messages"),
        messageData
      );
      console.log(`Message added with ID: ${messageRef.id}`);

      // Update the chat document: set lastMessage info and reset the messagesRead flag.
      await updateDoc(doc(db, "chats", chatId), {
        lastMessageAt: serverTimestamp(),
        lastMessage:
          content.substring(0, 50) + (content.length > 50 ? "..." : ""),
        lastMessageSenderId: user.uid,
        messagesRead: false,
      });
      console.log("Chat document updated with last message info");

      return messageRef.id;
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const value = {
    chats,
    loading,
    activeChat,
    activeMessages,
    chatUsers,
    setActiveChat,
    startChat,
    sendMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

ChatProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ChatProvider;
