import { component$ } from "@builder.io/qwik";
import styles from "./intro.module.css"
import BgPattern from "~/media/pattern1.webp?jsx";

export default component$(() => {
    return (
        <section class={styles.intro}>
            <BgPattern alt="flower pattern" />
            <BgPattern alt="flower pattern" class={styles.right_img}  />
            <div class={styles.intro_header}>
                <h1>Welcome to Knuckles Retreat Sri Lanka</h1>
                <h2>Retreat to Tranquility</h2>
                <p>Escape to a haven of serenity nestled in the heart of Sri Lanka's
                    Central Province. Welcome to Knuckles Retreat, where nature's
                    embrace invites you to experience the perfect blend of calm, cool,
                    and utter relaxation. We invite you to explore the breathtaking
                    landscapes of the Knuckles Mountain Range, a hiker's paradise
                    awaiting your footsteps. Venture into the lush trails, where every
                    step unveils the beauty of the surrounding forests, tea plantations,
                    and majestic mountains. Immerse yourself in the melody of cascading
                    waterfalls that adorn the landscape, creating a harmonious symphony of
                    nature. Discover the hidden gems around our retreat, where waterfalls
                    gracefully carve their way through the picturesque surroundings, offering
                    a soothing backdrop to your retreat.</p>
                <p>Knuckles Retreat is not just a destination; it's an invitation to create
                    memories. Whether you're an avid hiker seeking the thrill of the
                    mountain trails or a family yearning for quality time amid nature, our
                    retreat caters to diverse preferences. It's the perfect sanctuary for
                    couples seeking a romantic escape, families on vacation, and adventurers
                    eager to conquer the peaks. Your journey begins at Knuckles Retreat, where
                    every moment is an opportunity to connect with nature, rejuvenate your
                    spirit, and create lasting memories. Embrace the tranquility, and let the
                    magic of Knuckles unfold.</p>
                <br />
            </div>
        </section>
    );
})