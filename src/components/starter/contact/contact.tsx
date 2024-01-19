import { component$ } from "@builder.io/qwik";
import styles from "./contact.module.css";
import BgContour1 from "~/media/contour-lines-1.svg?jsx";
import BgContour2 from "~/media/contour-lines-2.svg?jsx";
import LogoSymbol from "~/media/Logo-Symbol.svg?jsx";

export default component$(() => {
    return (
        <section id="contact" class={styles.contact}>
            <BgContour1 class={[styles.bg_img, styles.top_img]} />
            <BgContour2 class={[styles.bg_img, styles.bottom_img]} />
            <h2>Contact Us</h2>
            <div class={styles.main_content}>
                <div class={styles.map}>
                    <iframe title="Knuckles Retreat Sri Lanka Google maps location" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3956.5787463638703!2d80.77979431144067!3d7.40100621231185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae35f038d4d7721%3A0x73186daaad420c8!2sKnuckles%20Retreat!5e0!3m2!1sen!2slk!4v1703453496693!5m2!1sen!2slk" width="100" height="100" style="border:0;" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                </div>
                <div class={styles.info}>
                    <div class={styles.logo}>
                        <LogoSymbol class={styles.logo_symbol}></LogoSymbol>
                        <h3>Knuckles Retreat</h3>
                        <h4>-RECONNECT WITH NATURE-</h4>
                    </div>
                    <h5>Knuckles Mountain Range, Knuckles Peak Road, Gomara, Sri Lanka</h5>
                    <h6><span>Telephone:</span><a href="tel:+94774410767">+94 77 441 0767</a></h6>
                    <h6><span>Email:</span>inquiries@knucklesretreat.com</h6>
                </div>
            </div>
        </section>
    );
});