// Server vs Client State — fakeApi.ts
//
// Simulates a real backend API with network latency.
// The same data is fetched in two ways in the demo:
//   ❌ useState + useEffect (wrong tool for server data)
//   ✅ React Query           (right tool for server data)

export interface User {
  id:         number;
  name:       string;
  email:      string;
  role:       "admin" | "editor" | "viewer";
  status:     "active" | "inactive";
  department: string;
  joinedAt:   string;
  avatar:     string; // initials
}

const USERS: User[] = [
  { id: 1,  name: "Alice Martin",   email: "alice@co.io",   role: "admin",  status: "active",   department: "Engineering", joinedAt: "2023-01-15", avatar: "AM" },
  { id: 2,  name: "Bob Chen",       email: "bob@co.io",     role: "editor", status: "active",   department: "Design",      joinedAt: "2023-03-22", avatar: "BC" },
  { id: 3,  name: "Carlos Rivas",   email: "carlos@co.io",  role: "viewer", status: "inactive", department: "Marketing",   joinedAt: "2023-05-10", avatar: "CR" },
  { id: 4,  name: "Diana Park",     email: "diana@co.io",   role: "editor", status: "active",   department: "Engineering", joinedAt: "2023-07-01", avatar: "DP" },
  { id: 5,  name: "Eve Taylor",     email: "eve@co.io",     role: "admin",  status: "active",   department: "Product",     joinedAt: "2023-08-14", avatar: "ET" },
  { id: 6,  name: "Frank Wu",       email: "frank@co.io",   role: "viewer", status: "active",   department: "Design",      joinedAt: "2023-09-03", avatar: "FW" },
  { id: 7,  name: "Grace Kim",      email: "grace@co.io",   role: "editor", status: "inactive", department: "Marketing",   joinedAt: "2023-10-20", avatar: "GK" },
  { id: 8,  name: "Hiro Tanaka",    email: "hiro@co.io",    role: "viewer", status: "active",   department: "Engineering", joinedAt: "2023-11-05", avatar: "HT" },
];

// Avatar color per person (deterministic)
const COLORS = ["#3b82f6","#8b5cf6","#ec4899","#f59e0b","#10b981","#06b6d4","#f97316","#ef4444"];
export const avatarColor = (id: number) => COLORS[(id - 1) % COLORS.length];

// Tracks how many times the API was actually called (shows caching benefit)
let callCount = 0;
export const getCallCount = () => callCount;
export const resetCallCount = () => { callCount = 0; };

export const fetchUsers = async (delay = 900): Promise<User[]> => {
  callCount++;
  await new Promise((r) => setTimeout(r, delay));
  // Simulate occasional error (5% chance) for error-state demo
  if (Math.random() < 0.05) throw new Error("Network error — server unavailable");
  return [...USERS];
};

export const fetchUserById = async (id: number): Promise<User> => {
  callCount++;
  await new Promise((r) => setTimeout(r, 500));
  const user = USERS.find((u) => u.id === id);
  if (!user) throw new Error(`User ${id} not found`);
  return user;
};
