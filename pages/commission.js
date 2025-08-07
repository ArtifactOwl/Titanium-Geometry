import React from "react";

export default function Commission() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Commission a Custom Pendant</h1>
      <p>Fill out the form below to request a custom titanium pendant design.</p>

      <form
        action="https://formsubmit.co/jaekle@gmail.com"
        method="POST"
        encType="multipart/form-data"
        style={{ display: "flex", flexDirection: "column", maxWidth: "400px", gap: "1rem" }}
      >
        <input type="hidden" name="_captcha" value="false" />
        <label>
          Name:
          <input type="text" name="name" required />
        </label>

        <label>
          Email:
          <input type="email" name="email" required />
        </label>

        <label>
          Describe your idea:
          <textarea name="description" rows="8" required></textarea>
        </label>

         <label>
          Preferred Color(s)- 
          Purple, Dark Blue, Light Blue, Red, Orange, Gold, Silver, Black, and Rainbow show up the best:
          <textarea name="colors" rows="5" required></textarea>
        </label>

        <label>
          Upload a design or a Rough Sketch of your Idea (optional):
          <input type="file" name="attachment" accept="image/*,application/pdf" />
        </label>

        <button type="submit">Submit Commission Request</button>
      </form>
    </div>
  );
}
