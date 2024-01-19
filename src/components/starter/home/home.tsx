import { component$, $, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { IoChevronForwardOutline, IoLogoFacebook, IoLogoInstagram, IoLogoYoutube } from "@qwikest/icons/ionicons";
import { useNavigate } from "@builder.io/qwik-city";
import styles from "./home.module.css";
import BgImage1 from "~/media/home/bg1.webp?jsx";
import BgImage2 from "~/media/home/bg2.webp?jsx";
import BgImage3 from "~/media/home/bg3.webp?jsx";
import BgImage4 from "~/media/home/bg4.webp?jsx";

export default component$(() => {
    const activeIndex = useSignal(0);
    const nav = useNavigate();

    // const animateContent = $(() => {
    //     const content = document.querySelector(`.${styles.content}`);
    //     content?.classList.add(styles.fadeOut);

    //     setTimeout(() => {
    //         content?.classList.remove(styles.fadeOut);
    //         content?.classList.add(styles.fadeIn);
    //         setTimeout(() => {
    //             content?.classList.remove(styles.fadeIn);
    //         }, 1000); // Adjust this time based on your animation duration
    //     }, 1000); // Adjust this time based on your animation duration
    // });

    const handleSlideActive = $((active: boolean) => {
        const slide = document.querySelector(`.${styles.slide}`);
        if (slide) {
            active ? slide.classList.add(styles.slide_active) : slide.classList.remove(styles.slide_active);
        }
    });

    const setActiveSlide = $((index: number, isInit?: boolean) => {
        // animateContent();
        if (activeIndex.value === index && !isInit) return;
        handleSlideActive(false);
        activeIndex.value = index;
        setTimeout(() => {
            handleSlideActive(true);
        }, 100)
    });

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
        setActiveSlide(0, true);
        const interval = setInterval(() => {
            // setActiveIndex((prevIndex) => (prevIndex + 1) % images.length);
            // animateContent();
            const nextIndex = (activeIndex.value + 1) % 4;
            setActiveSlide(nextIndex);
        }, 15000);
        cleanup(() => clearInterval(interval));
    });

    return (
        <section id="home" class={styles.home}>
            <div class={styles.social_icons}>
                <a href="https://web.facebook.com/profile.php?id=61554911975425" target="_blank" aria-label="Knuckles Retreat facebook page link icon"><i><IoLogoFacebook /></i></a>
                <a href="https://www.instagram.com/knucklesretreat" target="_blank" aria-label="Knuckles Retreat instagram account link icon"><i><IoLogoInstagram /></i></a>
                <a href="https://www.youtube.com/@KnucklesRetreat" target="_blank" aria-label="Knuckles Retreat youtube channel link icon"><i><IoLogoYoutube /></i></a>
            </div>

            {activeIndex.value === 0 &&
                <div class={[styles.bg_slider]}>
                    <div class={[styles.slide, styles.dark_layer]}>
                        <BgImage1 alt="picture of knuckles retreat sri lanka" />
                        <div class={styles.text_content}>
                            <h2 class={styles.title}>Harmony <span>Heights</span></h2>
                            <p>
                                At Knuckles Retreat, find your sanctuary amid mist-draped
                                mountains and verdant tea estates. Immerse yourself in the
                                hushed symphony of nature, where tranquility meets the heights
                                of harmony.
                            </p>
                            <button class={styles.inquire_btn} onClick$={() => nav('/inquiry')}>
                                Inquire Now <i><IoChevronForwardOutline /></i>
                            </button>
                        </div>
                    </div>
                </div>
            }

            {activeIndex.value === 1 &&
                <div class={[styles.bg_slider]}>
                    <div class={[styles.slide, styles.dark_layer]}>
                        <BgImage2 alt="picture of forest at knuckles sri lanka" />
                        <div class={styles.text_content}>
                            <h2 class={styles.title}>Whispering <span>Woodlands</span></h2>
                            <p>
                                In the heart of Sri Lanka's Central Provience, discover Knuckles
                                mountain range, where the lush embrace of nature whispers tales
                                of tranquility. A canvas of green, it's a haven where every leaf
                                has a story to tell.
                            </p>
                            <button class={styles.inquire_btn} onClick$={() => nav('/inquiry')}>
                                Inquire Now <i><IoChevronForwardOutline /></i>
                            </button>
                        </div>
                    </div>
                </div>
            }

            {activeIndex.value === 2 &&
                <div class={[styles.bg_slider]}>
                    <div class={[styles.slide, styles.dark_layer]}>
                        <BgImage3 alt="picture of a stream at knuckles sri lanka" />
                        <div class={styles.text_content}>
                            <h2 class={styles.title}>Sunlit <span>Serenade</span></h2>
                            <p>
                                Embark on a sunlit journey at Knuckles Retreat, where a river's
                                melody meets the distant mountains' silhouette. Under the gentle
                                caress of sunlight, each moment becomes a serenade to nature's
                                grandeur.
                            </p>
                            <button class={styles.inquire_btn} onClick$={() => nav('/inquiry')}>
                                Inquire Now <i><IoChevronForwardOutline /></i>
                            </button>
                        </div>
                    </div>
                </div>
            }

            {activeIndex.value === 3 &&
                <div class={[styles.bg_slider]}>
                    <div class={[styles.slide, styles.dark_layer]}>
                        <BgImage4 alt="picture of sunset at knuckles sri lanka" />
                        <div class={styles.text_content}>
                            <h2 class={styles.title}>Twilight <span>Tranquility</span></h2>
                            <p>
                                As daylight fades, Knuckles Retreat reveals its twilight charm.
                                Amidst the golden glow, the mountains and forests weave a
                                tranquil tapestry, inviting you to lose yourself in nature's
                                quiet symphony.
                            </p>
                            <button class={styles.inquire_btn} onClick$={() => nav('/inquiry')}>
                                Inquire Now <i><IoChevronForwardOutline /></i>
                            </button>
                        </div>
                    </div>
                </div>
            }

            <div class={styles.bg_slider_thumbs}>
                <div class={styles.thumbs_container}>
                    <BgImage1 alt="picture of knuckles retreat sri lanka" onClick$={() => setActiveSlide(0)} class={[styles.thumb_img, activeIndex.value === 0 ? styles.thumb_active : '']} />
                    <BgImage2 alt="picture of forest at knuckles sri lanka" onClick$={() => setActiveSlide(1)} class={[styles.thumb_img, activeIndex.value === 1 ? styles.thumb_active : '']} />
                    <BgImage3 alt="picture of a stream at knuckles sri lanka" onClick$={() => setActiveSlide(2)} class={[styles.thumb_img, activeIndex.value === 2 ? styles.thumb_active : '']} />
                    <BgImage4 alt="picture of sunset at knuckles sri lanka" onClick$={() => setActiveSlide(3)} class={[styles.thumb_img, activeIndex.value === 3 ? styles.thumb_active : '']} />
                </div>
            </div>

        </section>
    );
});