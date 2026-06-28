import { redirect } from "next/navigation"

// OTP auth: signup and login are the same flow.
export default function SignupPage() {
  redirect("/login")
}
