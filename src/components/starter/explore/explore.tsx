import { component$ } from "@builder.io/qwik";
import styles from "./explore.module.css";
import BgPattern from "~/media/pattern1.webp?jsx";
import BgContour from "~/media/contour-lines-1.svg?jsx";

export default component$(() => {
    return (
        <section id="explore" class={styles.explore}>
            <BgPattern alt="flower pattern" class={styles.bg_img} />
            <BgContour class={[styles.bg_img, styles.bottom_img]} />
            <div class={styles.main_content}>
                <div class={styles.txt_content}>
                    <h2>Explore Knuckles</h2>
                    <p>Embark on a journey of discovery at Knuckles Retreat. Uncover
                        the hidden treasures of the Knuckles Mountain Range, traverse
                        scenic trails, and indulge in the natural serenity that awaits
                        your exploration.</p>
                    <p>Named after its distinct knuckle-shaped peaks, the mountain range is renowned
                        for its lush forests, pristine waterfalls, and an abundance of
                        biodiversity. The cool, misty climate that blankets the peaks enhances
                        the mystique of the region, creating an atmosphere that is both serene
                        and invigorating.</p>
                </div>

                <div class={styles.img_grid}>
                    <div class={styles.grid_container}>
                        <div class={styles.grid_item}></div>
                        <div class={styles.grid_item}></div>
                        <div class={styles.grid_item}></div>
                        <div class={styles.grid_item}></div>
                    </div>
                </div>
            </div>
        </section>
    );
});
