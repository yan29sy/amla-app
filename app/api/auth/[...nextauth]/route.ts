import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials"; // Example: Use credentials for simple email/password

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Add your auth logic here (e.g., check against DB). For demo, hardcode:
        if (credentials?.email === "user@example.com" && credentials?.password === "pass") {
          return { id: "1", name: "User", email: "user@example.com" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login", // Your login page
  },
  secret: process.env.NEXTAUTH_SECRET, // Add to .env: NEXTAUTH_SECRET=your-secret-key (generate with openssl rand -base64 32)
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };