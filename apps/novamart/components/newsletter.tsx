"use client";
import { useState } from "react";

export function Newsletter() {
  const [error, setError] = useState(false);
  return <form className="newsletter" onSubmit={(event) => { event.preventDefault(); setError(true); }}><div><p className="eyebrow">The Nova edit</p><h2>Objects for better everyday living.</h2></div><div className="newsletter-field"><input type="email" placeholder="Email address" data-source-file="components/newsletter.tsx" data-source-line="6" data-component-name="Newsletter" />{error ? <p className="field-error">Please enter a valid email address.</p> : null}<button type="submit">Join newsletter</button></div></form>;
}
