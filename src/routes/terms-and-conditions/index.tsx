import { component$ } from "@builder.io/qwik";
import styles from "./tnc.module.css";

export default component$(() => {
    return (
        <section class={styles.tnc_sec}>
            <div class={styles.tnc_content}>
                <h1>TERMS AND CONDITIONS</h1>

                <h2>Reservation and Payment</h2>
                <ul>
                    <li>To secure a reservation, a 30% deposit of the total booking fee is required.</li>
                    <li>The remaining balance is due prior to the check-in.</li>
                    <li>Payments can be made through bank transfers or cash.</li>
                    <li>Changes to the reservation, including dates and the number of guests, are subject to availability and may incur additional charges.</li>
                </ul>

                <h2>Cancellation and Refund Policy</h2>
                <ul>
                    <li>Cancellations made 7 days or more prior to the check-in date will receive a full refund.</li>
                    <li>Cancellations made within 6 to 3 days of the check-in date are subject to 50% cancellation fee.</li>
                    <li>No refunds will be provided for cancellations made within 2 days of the check-in date.</li>
                </ul>

                <h2>Check-in and Check-out</h2>
                <ul>
                    <li>Check-in time is 01.00 pm, and check-out time is 11.00 am.</li>
                    <li>Early check-in or late check-out may be available upon request and subject to an additional fee.</li>
                </ul>

                <h2>Occupancy and Child Policy</h2>
                <ul>
                    <li>The maximum occupancy for each accommodation cannot exceed the reserverd person count.</li>
                    <li>Additional guests beyond the specified occupancy may result in additional charges or termination of the reservation.</li>
                    <li>Guests aged 12 year and above are considered as adults and guests below 12 years are considered as children.</li>
                </ul>

                <h2>Property Use</h2>
                <ul>
                    <li>The property is to be used solely for vacation purposes and not for any commercial or illegal activities.</li>
                    <li>Guests are responsible for any damage to the property and its contents during their stay.</li>
                    <li>Guests are expected to adhere to the property's specific house rules, which may include noise restrictions, smoking policies, and other guidelines.</li>
                </ul>

                <h2>Force Majeure</h2>
                <p>The business is not responsible for any losses, damages, or inconvenience caused by events beyond its control, including but not limited to natural disasters, acts of terrorism, or government actions.</p>

                <h2>Contact Information</h2>
                <p>For any inquiries or concerns, please contact us, inquiries@knucklesretreat.com, +94774410767.</p>

                <h2>Agreement Acceptance</h2>
                <p>By making a reservation, guests acknowledge that they have read, understood, and agreed to these terms and conditions.</p>

            </div>
        </section>
    );
});