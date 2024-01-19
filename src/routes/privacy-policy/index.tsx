import { component$ } from "@builder.io/qwik";
import styles from "./privacy.module.css";

export default component$(() => {
    return (
        <section class={styles.privacy_sec}>
            <div class={styles.privacy_content}>
                <h1>PRIVACY POLICY</h1>
                <h3>Last Updated: 27 Dec, 2023</h3>

                <h2>Privacy and Data Protection</h2>
                <p>Welcome to the official website of Knuckles Retreat. This Privacy Policy outlines how we collect, use, disclose, and protect your personal information when you visit our website or use our services.</p>

                <h2>Information We Collect</h2>
                <ul>
                    <li>Personal Information: We may collect personal information such as names, contact details, payment information, and other relevant details necessary for reservations and communication.</li>
                    <li>Non-Personal Information: We may also collect non-personal information, including but not limited to browser type, IP address, and other anonymous data.</li>
                </ul>

                <h2>How We Use Your Information</h2>
                <ul>
                    <li>We use personal information to process reservations, provide customer support, and improve our services.</li>
                    <li>Non-personal information is used for analytical purposes to enhance user experience and optimize our website.</li>
                </ul>

                <h2>Information Sharing</h2>
                <ul>
                    <li>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as required by law.</li>
                    <li>We may share information with trusted third parties, such as payment processors, for the purpose of completing reservations.</li>
                </ul>

                <h2>Security Measures</h2>
                <ul>
                    <li>We implement security measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction.</li>
                    <li>Despite our efforts, please be aware that no data transmission over the internet is completely secure.</li>
                </ul>

                <h2>Cookies and Tracking Technologies</h2>
                <p>We use cookies and similar tracking technologies to enhance your experience on our website and gather information about your usage patterns.</p>

                <h2>Third-Party Links</h2>
                <p>Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these websites.</p>

                <h2>Children's Privacy</h2>
                <p>Our services are not directed at children under the age of 13. We do not knowingly collect personal information from children.</p>

                <h2>Changes to Privacy Policy</h2>
                <p>We may update our Privacy Policy periodically. The date of the last update will be displayed at the top of this policy.</p>

                <h2>Your Choices</h2>
                <p>You have the right to access, correct, or delete your personal information. Contact us at inquiries@knucklesretreat.com for assistance.</p>

                <h2>Consent</h2>
                <p>By using our website or services, you consent to the terms of this Privacy Policy.</p>

            </div>
        </section>
    );
});