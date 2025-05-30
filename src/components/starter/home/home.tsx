import { component$, $, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { IoChevronForwardOutline, IoLogoFacebook, IoLogoInstagram, IoLogoYoutube } from "@qwikest/icons/ionicons";
import { useNavigate } from "@builder.io/qwik-city";
import styles from "./home.module.css";
// import BgImage1 from "~/media/home/bg1.webp?jsx";
// import BgImage1Sm from "~/media/home/bg1-sm.webp?jsx";
import BgImage2 from "~/media/home/bg2.webp?jsx";
import BgImage3 from "~/media/home/bg3.webp?jsx";
import BgImage4 from "~/media/home/bg4.webp?jsx";
import TmbImage1 from "~/media/home/thumbs/tmb1.webp?jsx";
import TmbImage2 from "~/media/home/thumbs/tmb2.webp?jsx";
import TmbImage3 from "~/media/home/thumbs/tmb3.webp?jsx";
import TmbImage4 from "~/media/home/thumbs/tmb4.webp?jsx";

export default component$(() => {
    const activeIndex = useSignal(0);
    const isLargeScreen = useSignal(false);
    const nav = useNavigate();
    const scrollY = useSignal(0);
    const isTransitioning = useSignal(false);

    // Handle parallax effect
    const handleScroll = $(() => {
        if (typeof window !== "undefined") {
            scrollY.value = window.scrollY;
        }
    });

    // Setup slide transition
    const setActiveSlide = $((index: number, isInit?: boolean) => {
        if (activeIndex.value === index && !isInit) return;
        if (isTransitioning.value && !isInit) return;

        isTransitioning.value = true;

        // Set a slight delay to ensure the fade-out animation completes
        setTimeout(() => {
            activeIndex.value = index;

            // Reset transitioning state after the fade-in animation is complete
            setTimeout(() => {
                isTransitioning.value = false;
            }, 1500); // Match this with the CSS transition duration
        }, isInit ? 0 : 800); // shorter delay for init, normal delay for transitions
    });

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
        // Initialize first slide
        setActiveSlide(0, true);

        // Check screen size
        if (typeof window !== "undefined") {
            isLargeScreen.value = window.innerWidth >= 460;

            // Set up scroll listener for parallax
            window.addEventListener("scroll", () => handleScroll());

            // Handle window resize
            const handleResize = () => {
                isLargeScreen.value = window.innerWidth >= 460;
            };
            window.addEventListener("resize", handleResize);
        }

        // Auto-rotate slides
        const interval = setInterval(() => {
            if (!isTransitioning.value) {
                const nextIndex = (activeIndex.value + 1) % 4;
                setActiveSlide(nextIndex);
            }
        }, 15000);

        cleanup(() => {
            clearInterval(interval);
            if (typeof window !== "undefined") {
                window.removeEventListener("scroll", () => handleScroll());
                window.removeEventListener("resize", () => {
                    isLargeScreen.value = window.innerWidth >= 460;
                });
            }
        });
    });

    // Determine which animation class to use based on slide index
    const getAnimationClass = (index: number) => {
        switch (index) {
            case 0: return styles.zoom_in;
            case 1: return styles.zoom_out;
            case 2: return styles.zoom_in;
            case 3: return styles.zoom_out;
            default: return styles.zoom_in;
        }
    };

    // Calculate parallax offset based on scroll position
    const getParallaxStyle = (factor = 0.2) => {
        return {
            transform: `translateY(${scrollY.value * factor}px)`
        };
    };

    return (
        <section id="home" class={styles.home}>
            <div class={styles.social_icons}>
                <a href="https://web.facebook.com/profile.php?id=61554911975425" target="_blank" aria-label="Knuckles Retreat facebook page link icon"><i><IoLogoFacebook /></i></a>
                <a href="https://www.instagram.com/knucklesretreat" target="_blank" aria-label="Knuckles Retreat instagram account link icon"><i><IoLogoInstagram /></i></a>
                <a href="https://www.youtube.com/@KnucklesRetreat" target="_blank" aria-label="Knuckles Retreat youtube channel link icon"><i><IoLogoYoutube /></i></a>
            </div>

            <div class={styles.hero_slider}>
                {/* Slide 1 */}
                <div class={[
                    styles.slide,
                    activeIndex.value === 0 ? styles.slide_active : '',
                    styles.dark_layer
                ]}>
                    {/*{!isLargeScreen.value
                        ? <BgImage1Sm
                            class={[styles.slide_bg, getAnimationClass(0)]}
                            alt="picture of knuckles retreat sri lanka"
                            style={getParallaxStyle(0.1)}
                        />
                        : <BgImage1
                            class={[styles.slide_bg, getAnimationClass(0)]}
                            alt="picture of knuckles retreat sri lanka"
                            style={getParallaxStyle(0.1)}
                        />}*/}
                    <picture>
                        <source
                            media="(max-width: 460px)"
                            srcset="src/media/home/bg1-sm.webp"
                        />
                        <source
                            media="(min-width: 461px)"
                            srcset="src/media/home/bg1.webp"
                        />
                        <img
                            class={[styles.slide_bg, getAnimationClass(0)]}
                            alt="picture of knuckles retreat sri lanka"
                            style={getParallaxStyle(0.1)}
                            width={100}
                            height={100}
                        />
                    </picture>
                    <div class={styles.text_content} style={getParallaxStyle(-0.1)}>
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

                {/* Slide 2 */}
                <div class={[
                    styles.slide,
                    activeIndex.value === 1 ? styles.slide_active : '',
                    styles.dark_layer
                ]}>
                    <BgImage2
                        class={[styles.slide_bg, getAnimationClass(1)]}
                        alt="picture of forest at knuckles sri lanka"
                        style={getParallaxStyle(0.1)}
                    />
                    <div class={styles.text_content} style={getParallaxStyle(-0.1)}>
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

                {/* Slide 3 */}
                <div class={[
                    styles.slide,
                    activeIndex.value === 2 ? styles.slide_active : '',
                    styles.dark_layer
                ]}>
                    <BgImage3
                        class={[styles.slide_bg, getAnimationClass(2)]}
                        alt="picture of a stream at knuckles sri lanka"
                        style={getParallaxStyle(0.1)}
                    />
                    <div class={styles.text_content} style={getParallaxStyle(-0.1)}>
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

                {/* Slide 4 */}
                <div class={[
                    styles.slide,
                    activeIndex.value === 3 ? styles.slide_active : '',
                    styles.dark_layer
                ]}>
                    <BgImage4
                        class={[styles.slide_bg, getAnimationClass(3)]}
                        alt="picture of sunset at knuckles sri lanka"
                        style={getParallaxStyle(0.1)}
                    />
                    <div class={styles.text_content} style={getParallaxStyle(-0.1)}>
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

            <div class={styles.bg_slider_thumbs}>
                <div class={styles.thumbs_container}>
                    <div onClick$={() => setActiveSlide(0)}>
                        <TmbImage1 alt="picture of knuckles retreat sri lanka" class={[styles.thumb_img, activeIndex.value === 0 ? styles.thumb_active : '']} />
                    </div>
                    <div onClick$={() => setActiveSlide(1)}>
                        <TmbImage2 alt="picture of forest at knuckles sri lanka" class={[styles.thumb_img, activeIndex.value === 1 ? styles.thumb_active : '']} />
                    </div>
                    <div onClick$={() => setActiveSlide(2)}>
                        <TmbImage3 alt="picture of a stream at knuckles sri lanka" class={[styles.thumb_img, activeIndex.value === 2 ? styles.thumb_active : '']} />
                    </div>
                    <div onClick$={() => setActiveSlide(3)}>
                        <TmbImage4 alt="picture of sunset at knuckles sri lanka" class={[styles.thumb_img, activeIndex.value === 3 ? styles.thumb_active : '']} />
                    </div>
                </div>
            </div>

        </section>
    );
});