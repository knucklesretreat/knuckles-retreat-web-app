import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import styles from "./contact.module.css";

import BgImg from "~/media/contact/bg_tea.webp?url"
import LogoSymbol from "~/media/Logo-Symbol.svg?jsx";

export default component$(() => {
    const isVisible = useSignal(false);
    const sectionRef = useSignal<Element>();
    // const crntBgImg = useSignal(BgImg);

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
        // const handleResize = () => {
        //     if (window.innerWidth <= 876) {
        //         crntBgImg.value = BgImgSm;
        //     } else {
        //         crntBgImg.value = BgImg;
        //     }
        //     (element as HTMLElement).style.backgroundImage = `url(${crntBgImg.value})`;
        // };

        // Initial check on load
        // handleResize();

        // Add resize listener
        // window.addEventListener('resize', handleResize, { passive: true });

        // Parallax Effect on Scroll
        const handleScroll = () => {
            const explore = document.getElementById('explore');
            const testimonials = document.getElementById('testimonials');
            const offset = 60; // header offset height

            // Get their positions relative to the document top
            const testimonialsBottom = testimonials
                ? testimonials.getBoundingClientRect().bottom + window.scrollY
                : (explore!.getBoundingClientRect().bottom + window.scrollY) || 0;

            const scrollY = window.scrollY - testimonialsBottom + offset;

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
            // window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', scrollListener);
            // Reset background position on cleanup if needed
            (element as HTMLElement).style.backgroundPositionY = '0px';
            // if (element) {
            // }
        });

    }, { strategy: 'document-ready' }); // Ensure element exists before running

    return (
        <section id="contact" ref={sectionRef} class={styles.contact} style={{ backgroundImage: `url(${BgImg})` }}>
            <div class={styles.overlay}></div>
            <div class={[styles.content, isVisible.value ? styles.animate : '']}>
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
            </div>
        </section>
    );
});