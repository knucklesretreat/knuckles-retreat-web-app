import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import styles from "./accommodation.module.css";

import BgImg from "~/media/accommodation/img1.webp?url"
import BgImgSm from "~/media/accommodation/img1-sm.webp?url"

export default component$(() => {
    const isVisible = useSignal(false);
    const sectionRef = useSignal<Element>();
    const crntBgImg = useSignal(BgImg);
    const nav = useNavigate();

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup, track }) => {
        // Track the ref to ensure it's assigned before using it
        track(() => sectionRef.value);

        const element = sectionRef.value;
        if (!element || typeof window === 'undefined') {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        isVisible.value = true;
                        // Optional: Unobserve after becoming visible if animation only runs once
                        // observer.unobserve(element);
                    }
                    // Reset animation when scrolling out
                    // else {
                    //  isVisible.value = false;
                    // }
                });
            },
            {
                threshold: 0.3, // Trigger when 30% of the element is visible
            }
        );

        observer.observe(element);

        // Handle responsive background image
        const handleResize = () => {
            if (window.innerWidth <= 876) {
                crntBgImg.value = BgImgSm;
            } else {
                crntBgImg.value = BgImg;
            }
            (element as HTMLElement).style.backgroundImage = `url(${crntBgImg.value})`;
        };

        // Initial check on load
        handleResize();

        // Add resize listener
        window.addEventListener('resize', handleResize, { passive: true });

        // Parallax Effect on Scroll
        const handleScroll = () => {
            const home = document.getElementById('home');
            const intro = document.getElementById('intro');
            const offset = 60; // header offset height

            // Get their positions relative to the document top
            const introBottom = intro
                ? intro.getBoundingClientRect().bottom + window.scrollY
                : (home!.getBoundingClientRect().bottom + window.scrollY) || 0;

            const scrollY = window.scrollY - introBottom + offset;

            // Adjust the speed factor (0.3 here) for more/less parallax effect
            // A lower number means the background moves slower
            const parallaxOffset = scrollY * 0.3;
            // Apply the transform directly for smoother performance
            (element as HTMLElement).style.backgroundPositionY = `${parallaxOffset}px`;
        };

        // Throttle scroll events using requestAnimationFrame
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

        // Check initial position in case element is already in view on load
        handleScroll();
        window.addEventListener('scroll', scrollListener, { passive: true });

        cleanup(() => {
            observer.unobserve(element);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', scrollListener);
            // Reset background position on cleanup if needed
            if (element) {
                (element as HTMLElement).style.backgroundPositionY = '0px';
            }
        });

    }, { strategy: 'document-ready' }); // Ensure element exists before running

    return (
        // Assign the ref to the section element
        <section ref={sectionRef} class={styles.accommodation} style={{ backgroundImage: `url(${crntBgImg.value})` }}>
            <div class={styles.overlay}></div>
            <div class={[styles.content, isVisible.value ? styles.animate : '']}>
                <h2>Your Private Sanctuary</h2>
                <p>
                    Discover unparalleled comfort in our thoughtfully designed rooms.
                    Each space blends rustic charm with modern amenities, offering
                    stunning views of the Knuckles mountain range. Wake up to the sounds of nature
                    and unwind in tranquility after a day of exploration. Perfect for
                    couples, families, and solo adventurers seeking peace and relaxation.
                </p>
                <button class={styles.explore_btn} onClick$={() => nav('/accommodation')}>
                    Explore
                </button>
            </div>
        </section>
    );
});