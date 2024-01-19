import { component$, useVisibleTask$, $ } from "@builder.io/qwik";
import styles from "./header.module.css";
import { MatBlurOnOutlined, MatCloseOutlined, MatExploreOutlined, MatHomeOutlined, MatPhotoLibraryOutlined, MatMailOutlined } from "@qwikest/icons/material";
import LogoSymbol from "~/media/Logo-Symbol.svg?jsx";
import { useNavigate } from "@builder.io/qwik-city";

export default component$(() => {
  const nav = useNavigate();
  const handleScroll = $(() => {
    const header = document.querySelector('header');
    if (header) {
      header.classList.toggle(styles.sticky, window.scrollY > 0);
      header.classList.toggle(styles.logo_only, window.scrollY > 0);
    }
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    if (typeof window === "undefined") return;
    // Navigation bar effects on scroll
    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener when the component is unmounted
    cleanup(() => window.removeEventListener('scroll', handleScroll));
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
    <header class={styles.header}>
      <div class={styles.logo_wrapper} onClick$={() => nav('/')}>
        <LogoSymbol alt="knuckles retreat logo" class={styles.logo_symbol} />
        <h4>Knuckles Retreat</h4>
        <h5>-RECONNECT WITH NATURE-</h5>
      </div>
      <div class={styles.nav_bar}>
        <div></div>
        <div class={["navigation", styles.navigation]}>
          <div class={styles.nav_items}>
            <i class={styles.nav_close_btn} onClick$={handleCloseBtnClick}><MatCloseOutlined /></i>
            <a href="/#home"><i><MatHomeOutlined /></i>Home</a>
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
