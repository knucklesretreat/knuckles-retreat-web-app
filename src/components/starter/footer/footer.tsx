import { component$ } from "@builder.io/qwik";
import { IoCallSolid, IoLogoFacebook, IoLogoInstagram, IoLogoYoutube, IoMailSolid } from "@qwikest/icons/ionicons";
import styles from "./footer.module.css";
import LogoSymbol from "~/media/Logo-Symbol.svg?jsx";
export default component$(() => {

  return (
    <footer>
      <div class={styles.footer_sec}>

        <div class={styles.footer_content}>
          <div class={[styles.sec, styles.about]}>
            <div class={styles.logo}>
              <LogoSymbol alt="knuckles retreat logo" class={styles.logo_symbol} />
              <h2>Knuckles Retreat</h2>
              <h3>-RECONNECT WITH NATURE-</h3>
            </div>
            <ul class={styles.social_icons}>
              <li><a href="https://web.facebook.com/profile.php?id=61554911975425" target="_blank" aria-label="Knuckles Retreat facebook page link icon"><i><IoLogoFacebook /></i></a></li>
              <li><a href="https://www.instagram.com/knucklesretreat" target="_blank" aria-label="Knuckles Retreat instagram account link icon"><i><IoLogoInstagram /></i></a></li>
              <li><a href="https://www.youtube.com/@KnucklesRetreat" target="_blank" aria-label="Knuckles Retreat youtube channel link icon"><i><IoLogoYoutube /></i></a></li>
            </ul>
          </div>

          <div class={[styles.sec, styles.quicklinks]}>
            <h2>Support</h2>
            <ul>
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/privacy-policy">Privacy Policy</a></li>
              <li><a href="/terms-and-conditions">Terms & Conditions</a></li>
            </ul>
          </div>

          <div class={[styles.sec, styles.quicklinks]}>
            <h2>Navigate</h2>
            <ul>
              <li><a href="/#home">Home</a></li>
              <li><a href="/#gallery">Gallery</a></li>
              <li><a href="/#explore">Explore</a></li>
            </ul>
          </div>

          <div class={[styles.sec, styles.contact]}>
            <h2>Contact Us</h2>
            <ul class={styles.info}>
              <li><i><IoCallSolid /></i><a href="tel:+94774410767">+94 77 441 0767</a></li>
              <li><i><IoMailSolid /></i><a href="mailto:inquiries@knucklesretreat.com">inquiries@knucklesretreat.com</a></li>
            </ul>
          </div>
        </div>

      </div>
      <div class={styles.copyright}>
        © Copyright 2023 - Knuckles Retreat. All Rights Reserved.
      </div>
    </footer>
  );
});
