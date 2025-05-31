import { component$, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import styles from "./accommodation.module.css";

import HeroImage from "~/media/accommodation/dining_out.webp?jsx"
import BgPattern from "~/media/pattern1.webp?jsx";
import BgBranch from "~/media/explore/branch.webp?jsx";
import ImgOne from "~/media/accommodation/room1.webp?url";
import ImgTwo from "~/media/accommodation/room3.webp?url";
import ImgThree from "~/media/accommodation/img1.webp?url";
import ImgFour from "~/media/accommodation/room4.webp?url";
import roomData from "~/data/rooms.json";
import LinePattern from "~/media/line-pattern.webp?url";

export const head: DocumentHead = {
    title: "Knuckles Retreat | Accommodation | Rooms",
    meta: [
        {
            name: "description",
            content: "Explore our curated room packages designed to enhance your stay at Knuckles Retreat, Sri Lanka. Each package offers unique benifits and experiences, tailored for an unforgettable escape.",
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

// Interface for room data
export interface Room {
    id: string;
    name: string;
    capacity: string;
    imageUrl: string;
    altText: string;
    types: { text: string; price: string }[];
}

const imageMap: Record<string, string> = {
    room1: ImgOne,
    room2: ImgThree,
    room3: ImgTwo,
    room4: ImgFour,
};

export default component$(() => {
    const rooms: Room[] = roomData.rooms;

    // Trigger animations when component is visible
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(() => {
        const hero = document.querySelector(`.${styles.hero}`);
        const roomCards = document.querySelectorAll(`.${styles.roomCard}`);
        const bookingSection = document.querySelector(`.${styles.bookingInquiry}`);

        if (hero) {
            hero.classList.add(styles.animateHero);
        }

        roomCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add(styles.animateRoomCard);
            }, index * 150); // Staggered animation for each card
        });

        if (bookingSection) {
            bookingSection.classList.add(styles.animateBooking);
        }
    });

    return (
        <section class={styles.accommodation_sec} style={{backgroundImage: `url(${LinePattern})`}}>
            <BgBranch class={[styles.bg_branch]} alt="Background Image" />
            <div class={styles.hero}>
                <HeroImage alt="Panoramic view of Knuckles Mountain Range" />
                <div class={styles.heroOverlay}>
                    <h1>Discover Our Room Packages</h1>
                    <p>Explore our curated room packages designed to enhance your stay at Knuckles Retreat.
                        Each package offers unique benifits and experiences, tailored for an unforgettable escape.</p>
                </div>
            </div>

            <div class={styles.container}>
                <div class={styles.roomGrid}>
                    {rooms.map((room) => (
                        <article key={room.id} class={styles.roomCard}>
                            <BgPattern loading="lazy" alt="flower pattern" class={[styles.bg_img, styles.top_img]} />
                            <div class={styles.roomImageWrapper}>
                                <img
                                    src={imageMap[room.imageUrl]}
                                    alt={room.altText}
                                    width="400"
                                    height="300"
                                    loading="lazy"
                                    class={styles.roomImage}
                                />
                            </div>
                            <div class={styles.roomInfo}>
                                <h2>{room.name}</h2>
                                <div class={styles.roomDetails}>
                                    <p>{room.capacity}</p>
                                </div>
                                <div class={styles.types}>
                                    <ul>
                                        {room.types.map((type) => (
                                            <li key={type.text}>
                                                <span class={styles.typeText} aria-hidden="true">{type.text}</span>
                                                {type.price} / night
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                <section class={styles.bookingInquiry}>
                    <h2>Ready to Experience Knuckles Retreat?</h2>
                    <p>Contact us today to plan your unforgettable stay or to inquire about specific room availability and custom packages.</p>
                    <a href="https://wa.me/+94774410767" target="_blank" class={styles.ctaButtonLarge}>Contact Now</a>
                </section>

            </div>
        </section>
    );
});