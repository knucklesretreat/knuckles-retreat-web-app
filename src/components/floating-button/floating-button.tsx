import { component$ } from "@builder.io/qwik";
import { IoLogoWhatsapp} from "@qwikest/icons/ionicons";
import styles from "./floating-button.module.css";

export default component$(() => {
    return (
        <div class={styles.floating_btn}>
            <a aria-label="Contact Knuckles Retreat on whatsapp" href="https://wa.me/+94774410767" target="_blank">
                <div class={styles.contact_icon}>
                    <IoLogoWhatsapp />
                </div>
            </a>
        </div>
    );
});