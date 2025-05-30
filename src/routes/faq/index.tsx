import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import styles from "./faq.module.css";

export const head: DocumentHead = {
  title: "Knuckles Retreat | FAQ",
  meta: [
    {
      name: "description",
      content: "Frequently asked questions stay at Knuckles Retreat, Sri Lanka.",
    },
    {
      name: "theme-color",
      content: "#274e13"
    },
    {
      property: "og:title",
      content: "Knuckles Retreat Sri Lanka"
    },
    {
      property: "og:description",
      content: "Knuckles Retreat Sri Lanka offers the perfect escape for a calm, cool and utterly relaxing getaway"
    },
    {
      property: "og:image",
      content: "https://firebasestorage.googleapis.com/v0/b/knuckles-retreat.appspot.com/o/kr-pic.png?alt=media&token=6a2d1e8b-cce8-49ff-80a6-b9276854c03e"
    },
    {
      property: "og:type",
      content: "website"
    },
    {
      property: "og:site_name",
      content: "Knuckles Retreat"
    },
    {
      property: "og:url",
      content: "https://www.knucklesretreat.com/"
    }
  ]
};

export default component$(() => {
    return (
        <section class={styles.faq_sec}>
            <div class={styles.faq_content}>
                <h1>Frequently Asked Questions (FAQ)</h1>

                <h2>1. How do I make a reservation?</h2>
                <p>To make a reservation, simply contact our customer service, and we will assist you with your reservation.</p>

                <h2>2. What payment methods do you accept?</h2>
                <p>We accept bank transfers and cash for reservations. Please contact our customer service for more details.</p>

                <h2>3. What is your cancellation policy?</h2>
                <p>Our cancellation policy varies based on the timing of your cancellation. Please refer to our <a href="/terms-and-conditions">Terms and Conditions</a> for detailed information on cancellations and refunds.</p>

                <h2>4. Can I modify or change my reservation?</h2>
                <p>Yes, you may be able to modify your reservation based on availability. Contact our customer service for assistance with any changes.</p>

                <h2>5. What are the check-in and check-out times?</h2>
                <p>Check-in time is at 01.00 pm, and check-out time is at 11.00 am. Early check-in or late check-out may be available upon request, subject to an additional fee.</p>

                <h2>7. What happens if I damage something during my stay?</h2>
                <p>Guests are responsible for any damage caused to the property and its contents during their stay. Charges may apply to cover repair or replacement costs.</p>

                <h2>8. Are pets allowed?</h2>
                <p>Our pet policy varies. Please contact us directly to inquire about our pet policy for specific accommodations.</p>

                <h2>9. Is smoking allowed in the rooms or on the property?</h2>
                <p>Smoking is not permitted in our rooms or inside the villa. Please adhere to our no-smoking policy to ensure a comfortable stay for all guests.</p>

                <h2>10. Can I host an event or party at the property?</h2>
                <p>The property is for vacation purposes only, and hosting events or parties may be subject to approval and additional charges. Please contact us for more information.</p>

                <h2>11. How do I contact customer support?</h2>
                <p>You can reach our customer support team by emailing inquiries@knucklesretreat.com, or calling +94774410767. We're here to assist you with any questions or concerns.</p>

                <h2>12. Do you offer discounts for extended stays?</h2>
                <p>We may offer discounts for extended stays. Please check our promotions or contact our customer service for information on long-term stay discounts.</p>

            </div>
        </section>
    );
});