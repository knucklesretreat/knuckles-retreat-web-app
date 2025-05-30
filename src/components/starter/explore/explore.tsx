import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
import styles from "./explore.module.css";
import BgPattern from "~/media/pattern1.webp?jsx";
import BgBranch from "~/media/explore/branch.webp?jsx";
import ImgOne from "~/media/explore/imgone.jpg?url";
import ImgTwo from "~/media/explore/img2.webp?url";
import ImgThree from "~/media/explore/img3.webp?url";
import ImgFour from "~/media/explore/img4.webp?url";

export default component$(() => {
    const scrollY = useSignal(0);
    const exploreSectionRef = useSignal<Element>();
    const textContentRef = useSignal<Element>();
    const imgGridRef = useSignal<Element>();
    const gridContainerRef = useSignal<Element>();

    const textContentVisible = useSignal(false);
    const imgGridVisible = useSignal(false);
    const exploreSectionVisible = useSignal(false);

    // Track visibility for animation triggers
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup, track }) => {
        track(() => textContentRef.value);
        track(() => imgGridRef.value);
        track(() => exploreSectionRef.value);

        const elementsToObserve: { ref: Signal<Element | undefined>, signal: Signal<boolean> }[] = [
            { ref: textContentRef, signal: textContentVisible },
            { ref: imgGridRef, signal: imgGridVisible },
            { ref: exploreSectionRef, signal: exploreSectionVisible },
        ];

        if (typeof IntersectionObserver === 'undefined') return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const elementConfig = elementsToObserve.find(el => el.ref.value === entry.target);
                        if (elementConfig) {
                            elementConfig.signal.value = true;
                            if (elementConfig.ref !== exploreSectionRef) {
                                observer.unobserve(entry.target);
                            }
                        }
                    } else {
                        if (entry.target === exploreSectionRef.value) {
                            exploreSectionVisible.value = false;
                        }
                    }
                });
            },
            {
                threshold: 0.2,
            }
        );

        elementsToObserve.forEach(elementConfig => {
            if (elementConfig.ref.value) {
                observer.observe(elementConfig.ref.value);
            }
        });

        cleanup(() => observer.disconnect());
    }, { strategy: 'document-ready' });

    // Parallax effect on scroll
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup, track }) => {
        const isVisible = track(() => exploreSectionVisible.value);
        const gridEl = track(() => gridContainerRef.value);
        const sectionEl = track(() => exploreSectionRef.value);
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

            const parallaxFactor = -0.08;
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
        <section id="explore" ref={exploreSectionRef} class={styles.explore}>
            <BgPattern
                alt="flower pattern"
                class={[styles.bg_img, styles.top_img]}
                style={{
                    transform: `translateY(${scrollY.value * 0.3}px)`,
                }}
            />
            <BgBranch class={[styles.bg_branch]} alt="Background image"/>
            <div class={styles.main_content}>
                <div
                    ref={textContentRef}
                    class={[
                        styles.txt_content,
                        { [styles.visible]: textContentVisible.value }
                    ]}
                >
                    <h2>Explore Knuckles</h2>
                    <p>
                        Embark on a journey of discovery at Knuckles Retreat. Uncover the
                        hidden treasures of the Knuckles Mountain Range, traverse scenic
                        trails, and indulge in the natural serenity that awaits your
                        exploration.
                    </p>
                    <p>
                        Named after its distinct knuckle-shaped peaks, the mountain range is
                        renowned for its lush forests, pristine waterfalls, and an abundance
                        of biodiversity. The cool, misty climate that blankets the peaks
                        enhances the mystique of the region, creating an atmosphere that is
                        both serene and invigorating.
                    </p>
                </div>

                <div
                    ref={imgGridRef}
                    class={[
                        styles.img_grid,
                        { [styles.visible]: imgGridVisible.value }
                    ]}
                >
                    <div ref={gridContainerRef} class={styles.grid_container}>
                        <div class={styles.grid_item} style={{ backgroundImage: `url(${ImgOne})` }}></div>
                        <div class={styles.grid_item} style={{ backgroundImage: `url(${ImgTwo})` }}></div>
                        <div class={styles.grid_item} style={{ backgroundImage: `url(${ImgThree})` }}></div>
                        <div class={styles.grid_item} style={{ backgroundImage: `url(${ImgFour})` }}></div>
                    </div>
                </div>
            </div>
        </section>
    );
});