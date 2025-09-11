// import { LoginForm } from "@/components/login-form"

// export default function LoginPage() {
//   return (
//     <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
//       <div className="w-full max-w-sm">
//         <LoginForm />
//       </div>
//     </div>
//   )
// }

// "use client";

// import { signIn } from "next-auth/react";
// import { useState } from "react";

// export default function Login() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     await signIn("credentials", { username, password, redirect: true, callbackUrl: "/" });
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
//       <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
//       <button type="submit">Login</button>
//     </form>
//   );
// }

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/"); // Redirect to home if logged in
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>; // Optional: Add a loading spinner
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}