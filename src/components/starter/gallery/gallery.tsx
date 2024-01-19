import { component$ } from "@builder.io/qwik";
import styles from "./gallery.module.css";
import BgPattern from "~/media/pattern1.webp?jsx";

export default component$(() => {
    return (
        <section id="gallery" class={styles.gallery}>
            <BgPattern alt="flower pattern" class={[styles.bg_img, styles.top_img]} />
            <BgPattern alt="flower pattern" class={[styles.bg_img, styles.bottom_img]} />
            <div class={styles.gallery_grid}>
                <div class={styles.text_content}>
                    <h2>Gallery</h2>
                    <p>Moments of joy, adventure, and relaxation. A testament to the unforgettable
                        memories created at Knuckles Retreat.</p>
                </div>
                <div class={styles.grid_container}>
                    <div class={styles.grid_item}></div>
                    <div class={styles.grid_item}></div>
                    <div class={styles.grid_item}></div>
                    <div class={styles.grid_item}></div>
                    <div class={styles.grid_item}></div>
                </div>
            </div>
        </section>
    );
})