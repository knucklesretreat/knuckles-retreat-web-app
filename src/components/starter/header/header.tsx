import { component$, useVisibleTask$, $, useSignal } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { MatBlurOnOutlined, MatCloseOutlined, MatExploreOutlined, MatHomeOutlined, MatPhotoLibraryOutlined, MatMailOutlined, MatKingBedOutlined } from "@qwikest/icons/material";
import styles from "./header.module.css";
import LogoSymbol from "~/media/Logo-Symbol.svg?jsx";
import BgPattern from "~/media/pattern1.webp?jsx";

export default component$(() => {
  const nav = useNavigate();
  const isScrolled = useSignal(false);

  const handleScroll = $(() => {
    if (typeof window === "undefined") return;
    isScrolled.value = window.scrollY > 0;
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    if (typeof window === "undefined") return;

    // Check initial scroll position
    isScrolled.value = window.scrollY > 0;

    // Throttle scroll event handling
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollListener);

    // Clean up the event listener when the component is unmounted
    cleanup(() => window.removeEventListener('scroll', scrollListener));
  });

  const handleMenuToggle = $(() => {
    const navigation = document.querySelector(`.${styles.navigation}`);
    if (navigation) {
      navigation.classList.add(styles.active);
    }
  });

  const handleCloseBtnClick = $(() => {
    const navigation = document.querySelector(`.${styles.navigation}`);
    if (navigation) {
      navigation.classList.remove(styles.active);
    }
  });

  return (
    <header class={[
      styles.header,
      isScrolled.value ? styles.sticky : '',
      isScrolled.value ? styles.logo_only : ''
    ]}>
      <div class={styles.logo_wrapper} onClick$={() => nav('/')}>
        <LogoSymbol class={styles.logo_symbol} />
        <h4>Knuckles Retreat</h4>
        <h5>-RECONNECT WITH NATURE-</h5>
      </div>
      <div class={styles.nav_bar}>
        <div></div>
        <div class={["navigation", styles.navigation]}>
          <div class={styles.nav_items}>
            <BgPattern alt="flower pattern" class={styles.bg_pattern} />
            <i class={styles.nav_close_btn} onClick$={handleCloseBtnClick}><MatCloseOutlined /></i>
            <a href="/#home"><i><MatHomeOutlined /></i>Home</a>
            <a href="/accommodation"><i><MatKingBedOutlined /></i>Accommodation</a>
            <a href="/#gallery"><i><MatPhotoLibraryOutlined /></i>Gallery</a>
            <a href="/#explore"><i><MatExploreOutlined /></i>Explore</a>
            <a href="/#contact"><i><MatMailOutlined /></i>Contact</a>
          </div>
        </div>
        <i class={styles.nav_menu_btn} onClick$={handleMenuToggle}><MatBlurOnOutlined /></i>
      </div>
    </header>
  );
});