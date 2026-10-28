// Runs in the browser: the site is a static export, so there is no server to run a server action.
// `useActionState` in ContactForm calls this directly when the form is submitted.

import { site } from "@/lib/site";

export type ContactState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<"name" | "email" | "message", string>>;
  // Echoed back so fields keep their values after React resets the form.
  values?: { name: string; email: string; phone: string; message: string; help: string[] };
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("company_website")) return { status: "success", message: "Thanks!" };

  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 50);
  const message = String(formData.get("message") ?? "").trim().slice(0, 5000);
  const help = formData.getAll("help").map(String).slice(0, 10);

  const values = { name, email, phone, message, help };

  const errors: ContactState["errors"] = {};
  if (!name) errors.name = "Please enter your name.";
  if (!EMAIL.test(email)) errors.email = "Please enter a valid email address.";
  if (!message) errors.message = "Please tell us a little about what you need.";
  if (Object.keys(errors).length) {
    return { status: "error", message: "Please check the highlighted fields.", errors, values };
  }

  // Set NEXT_PUBLIC_CONTACT_FORM_ENDPOINT (e.g. a Formspree form URL) when building to deliver
  // submissions. It is baked into the page at build time, so rebuild after changing it.
  // Until it is set, visitors are pointed to email and phone instead.
  const endpoint = process.env.NEXT_PUBLIC_CONTACT_FORM_ENDPOINT;
  if (!endpoint) {
    return {
      status: "error",
      message: `Our online form isn't connected yet. Please email ${site.email} or call ${site.phone}.`,
      values,
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name, email, phone, help: help.join(", "), message }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  } catch {
    return {
      status: "error",
      message: `Sorry, something went wrong. Please email ${site.email} or call ${site.phone}.`,
      values,
    };
  }

  return { status: "success", message: "Thanks! We've received your message and will be in touch shortly." };
}
