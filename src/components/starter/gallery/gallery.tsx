import { component$, useSignal, useVisibleTask$, Signal } from "@builder.io/qwik";
import styles from "./gallery.module.css";
import BgPattern from "~/media/pattern1.webp?jsx";
import ImgOne from "~/media/gallery/img1.webp?url";
import ImgTwo from "~/media/gallery/img2.webp?url";
import ImgThree from "~/media/gallery/img3.webp?url";
import ImgFour from "~/media/gallery/img4.webp?url";
import ImgFive from "~/media/gallery/img5.webp?url";
import ImgSix from "~/media/gallery/img6.webp?url";
import ImgSeven from "~/media/gallery/img7.webp?url";

export default component$(() => {
    const gallerySectionRef = useSignal<Element>();
    const textContentRef = useSignal<Element>();
    const galleryGridRef = useSignal<Element>();
    const gridContainerRef = useSignal<Element>();

    const textContentVisible = useSignal(false);
    const galleryGridVisible = useSignal(false);
    const gallerySectionVisible = useSignal(false);

    useVisibleTask$(({ cleanup, track }) => {
        track(() => textContentRef.value);
        track(() => galleryGridRef.value);
        track(() => gallerySectionRef.value);

        const elementsToObserve: { ref: Signal<Element | undefined>, signal: Signal<boolean> }[] = [
            { ref: textContentRef, signal: textContentVisible },
            { ref: galleryGridRef, signal: galleryGridVisible },
            { ref: gallerySectionRef, signal: gallerySectionVisible },
        ];

        if (typeof IntersectionObserver === 'undefined') return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const elementConfig = elementsToObserve.find(el => el.ref.value === entry.target);
                        if (elementConfig) {
                            elementConfig.signal.value = true;
                            if (elementConfig.ref !== gallerySectionRef) {
                                observer.unobserve(entry.target);
                            }
                        }
                    } else {
                        if (entry.target === gallerySectionRef.value) {
                            gallerySectionVisible.value = false;
                        }
                    }
                });
            },
            {
                threshold: 0.2, // Lowered threshold for earlier trigger
            }
        );

        elementsToObserve.forEach(elementConfig => {
            if (elementConfig.ref.value) {
                observer.observe(elementConfig.ref.value);
            }
        });

        cleanup(() => observer.disconnect());
    }, { strategy: 'document-ready' });

    useVisibleTask$(({ cleanup, track }) => {
        const isVisible = track(() => gallerySectionVisible.value);
        const gridEl = track(() => gridContainerRef.value);
        const sectionEl = track(() => gallerySectionRef.value);
        const contentEl = track(() => textContentRef.value);

        if (!isVisible || !gridEl || !sectionEl || !contentEl || typeof window === 'undefined') {
            if (gridEl) {
                (gridEl as HTMLElement).style.transform = 'translateY(0px)';
            }
            if (contentEl) {
                (contentEl as HTMLElement).style.transform = 'translateY(0px)';
            }
            return;
        }

        const handleScroll = () => {
            const rect = sectionEl.getBoundingClientRect();
            const sectionTop = rect.top + window.scrollY;
            const sectionHeight = rect.height;
            const viewportHeight = window.innerHeight;
            const scrollY = window.scrollY;

            const sectionCenter = sectionTop + sectionHeight / 2;
            const viewportCenter = scrollY + viewportHeight / 2;
            const diff = sectionCenter - viewportCenter;

            const parallaxFactor = -0.08; // Slightly reduced for smoother effect
            const maxTranslate = viewportHeight * 0.03;
            let translateY = diff * parallaxFactor;
            translateY = Math.max(-maxTranslate, Math.min(maxTranslate, translateY));

            window.requestAnimationFrame(() => {
                if (textContentRef.value) {
                    (textContentRef.value as HTMLElement).style.transform = `translateY(${translateY}px)`;
                    (textContentRef.value as HTMLElement).style.transition = 'transform 0.2s ease-out';
                }
                if (gridContainerRef.value) {
                    (gridContainerRef.value as HTMLElement).style.transform = `translateY(${translateY}px)`;
                    (gridContainerRef.value as HTMLElement).style.transition = 'transform 0.2s ease-out';
                }
            });
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });

        cleanup(() => {
            window.removeEventListener('scroll', handleScroll);
            if (textContentRef.value) {
                (textContentRef.value as HTMLElement).style.transform = 'translateY(0px)';
                (textContentRef.value as HTMLElement).style.transition = '';
            }
            if (gridContainerRef.value) {
                (gridContainerRef.value as HTMLElement).style.transform = 'translateY(0px)';
                (gridContainerRef.value as HTMLElement).style.transition = '';
            }
        });
    }, { strategy: 'document-idle' });

    return (
        <section
            id="gallery"
            ref={gallerySectionRef}
            class={styles.gallery}
        >
            <BgPattern loading="lazy" alt="flower pattern" class={[styles.bg_img, styles.top_img]} />
            <BgPattern loading="lazy" alt="flower pattern" class={[styles.bg_img, styles.bottom_img]} />

            <div
                ref={galleryGridRef}
                class={[
                    styles.gallery_grid,
                    { [styles.visible]: galleryGridVisible.value }
                ]}
            >
                <div
                    ref={textContentRef}
                    class={[
                        styles.text_content,
                        { [styles.visible]: textContentVisible.value }
                    ]}
                >
                    <h2>Gallery</h2>
                    <p>
                        Moments of joy, adventure, and relaxation. A testament to the unforgettable
                        memories created at Knuckles Retreat.
                    </p>
                </div>

                <div ref={gridContainerRef} class={styles.grid_container}>
                    <div class={styles.grid_item} style={{ "background-image": `url(${ImgOne})` }}></div>
                    <div class={styles.grid_item} style={{ "background-image": `url(${ImgTwo})` }}></div>
                    <div class={styles.grid_item} style={{ "background-image": `url(${ImgThree})` }}></div>
                    <div class={styles.grid_item} style={{ "background-image": `url(${ImgFour})` }}></div>
                    <div class={styles.grid_item} style={{ "background-image": `url(${ImgFive})` }}></div>
                    <div class={styles.grid_item} style={{ "background-image": `url(${ImgSix})` }}></div>
                    <div class={styles.grid_item} style={{ "background-image": `url(${ImgSeven})` }}></div>
                </div>
            </div>
        </section>
    );
});