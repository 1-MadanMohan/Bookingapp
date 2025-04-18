import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      axios
        .get("http://localhost:4000/api/profile", { withCredentials: true })
        .then(({ data }) => {
          setUser(data);
          setReady(true);
        })
        .catch((err) => {
          console.error("Profile fetch failed:", err);
          setReady(true); // 💥 Ensure ready is true even if the API fails
        });
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, ready }}>
      {children}
    </UserContext.Provider>
  );
}