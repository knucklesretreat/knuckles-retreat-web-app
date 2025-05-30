import { component$, useSignal, useStore, useVisibleTask$, $, Signal } from "@builder.io/qwik";
import styles from "./testimonial.module.css";
import { IoChevronForwardOutline, IoChevronBackOutline, IoStarSolid } from "@qwikest/icons/ionicons";
import BgBranch from "~/media/explore/branch.webp?jsx";
import ImgQuote from "~/media/testimonial/quote.svg?url";
import testimonials from "~/data/testimonials.json";

interface Testimonial {
  id: string;
  author: string;
  avatarUrl?: string;
  rating: number;
  text: string;
  date: string;
  source: string;
}

export default component$(() => {
  const testimonialsStore = useStore<{
    testimonials: Testimonial[];
    currentIndex: number;
    direction: 'next' | 'prev' | 'none';
    transitioningTo: { index: number; direction: 'next' | 'prev' } | null;
  }>({
    testimonials,
    currentIndex: 0,
    direction: 'none',
    transitioningTo: null,
  });

  const testimonialsSectionRef = useSignal<Element>();
  const titleRef = useSignal<Element>();
  const carouselContainerRef = useSignal<Element>();
  const sectionVisible = useSignal(false);
  const titleVisible = useSignal(false);
  const carouselVisible = useSignal(false);
  const isTransitioning = useSignal(false);
  const bgBranchRef = useSignal<Element>();
  const isInitialMount = useSignal(true);
  const carouselHeight = useSignal<string>('290px'); // Dynamic height

  useVisibleTask$(({ cleanup, track }) => {
    track(() => titleRef.value);
    track(() => carouselContainerRef.value);
    track(() => testimonialsSectionRef.value);

    const elementsToObserve: { ref: Signal<Element | undefined>, signal: Signal<boolean> }[] = [
      { ref: titleRef, signal: titleVisible },
      { ref: carouselContainerRef, signal: carouselVisible },
      { ref: testimonialsSectionRef, signal: sectionVisible },
    ];

    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const elementConfig = elementsToObserve.find(el => el.ref.value === entry.target);
          if (elementConfig) {
            if (entry.isIntersecting) {
              elementConfig.signal.value = true;
            } else {
              if (entry.target === testimonialsSectionRef.value) {
                sectionVisible.value = false;
              }
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    elementsToObserve.forEach(elementConfig => {
      if (elementConfig.ref.value) {
        observer.observe(elementConfig.ref.value);
      }
    });

    cleanup(() => observer.disconnect());
  }, { strategy: 'document-ready' });

  useVisibleTask$(({ cleanup, track }) => {
    const isVisible = track(() => sectionVisible.value);
    const sectionEl = track(() => testimonialsSectionRef.value);
    const titleEl = track(() => titleRef.value);
    const carouselEl = track(() => carouselContainerRef.value);

    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      if (!sectionEl || !isVisible) {
        if (titleEl) (titleEl as HTMLElement).style.transform = 'translateY(0px)';
        if (carouselEl) (carouselEl as HTMLElement).style.transform = 'translateY(0px)';
        return;
      }

      const rect = sectionEl.getBoundingClientRect();
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const sectionTop = rect.top + scrollY;
      const sectionHeight = rect.height;
      const sectionCenter = sectionTop + sectionHeight / 2;
      const viewportCenter = scrollY + viewportHeight / 2;
      const diff = sectionCenter - viewportCenter;

      const contentParallaxFactor = -0.08;
      const maxContentTranslate = viewportHeight * 0.03;
      let contentTranslateY = diff * contentParallaxFactor;
      contentTranslateY = Math.max(-maxContentTranslate, Math.min(maxContentTranslate, contentTranslateY));

      window.requestAnimationFrame(() => {
        if (titleEl) {
          (titleEl as HTMLElement).style.transform = `translateY(${contentTranslateY}px)`;
          (titleEl as HTMLElement).style.transition = 'transform 0.2s ease-out';
        }
        if (carouselEl) {
          (carouselEl as HTMLElement).style.transform = `translateY(${contentTranslateY}px)`;
          (carouselEl as HTMLElement).style.transition = 'transform 0.2s ease-out';
        }
      });
    };

    if (isVisible) {
      handleScroll();
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    cleanup(() => {
      window.removeEventListener('scroll', handleScroll);
      if (titleEl) (titleEl as HTMLElement).style.transform = 'translateY(0px)';
      if (carouselEl) (carouselEl as HTMLElement).style.transform = 'translateY(0px)';
    });
  }, { strategy: 'document-idle' });

  useVisibleTask$(({ cleanup, track }) => {
    track(() => carouselVisible.value);
    if (carouselVisible.value) {
      setTimeout(() => {
        isInitialMount.value = false;
      }, 700);
    }
    cleanup(() => {
      isInitialMount.value = true;
    });
  }, { strategy: 'document-ready' });

  // Dynamic height adjustment
  useVisibleTask$(({ track, cleanup }) => {
    track(() => testimonialsStore.currentIndex);
    track(() => testimonialsStore.transitioningTo);
    track(() => carouselVisible.value);

    if (!carouselContainerRef.value || !carouselVisible.value) return;

    const updateHeight = () => {
      const container = carouselContainerRef.value!;
      const cards = container.querySelectorAll(`.${styles.testimonial_card}`);

      let maxHeight = 290; // Fallback height in pixels

      cards.forEach((card) => {
        const htmlCard = card as HTMLElement;
        const originalPosition = htmlCard.style.position;
        const originalTop = htmlCard.style.top;
        const originalLeft = htmlCard.style.left;
        const originalWidth = htmlCard.style.width;

        htmlCard.style.position = 'static';
        htmlCard.style.top = '';
        htmlCard.style.left = '';
        htmlCard.style.width = '100%';

        const cardHeight = htmlCard.offsetHeight;
        maxHeight = Math.max(maxHeight, cardHeight);

        htmlCard.style.position = originalPosition;
        htmlCard.style.top = originalTop;
        htmlCard.style.left = originalLeft;
        htmlCard.style.width = originalWidth;
      });

      carouselHeight.value = `${maxHeight}px`;
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    cleanup(() => {
      window.removeEventListener('resize', updateHeight);
    });
  }, { strategy: 'document-idle' });

  const showTestimonial = $((index: number, direction: 'next' | 'prev') => {
    if (isTransitioning.value) return;
    isTransitioning.value = true;

    testimonialsStore.transitioningTo = {
      index: (index + testimonialsStore.testimonials.length) % testimonialsStore.testimonials.length,
      direction,
    };

    setTimeout(() => {
      testimonialsStore.currentIndex = testimonialsStore.transitioningTo!.index;
      testimonialsStore.direction = direction;
      testimonialsStore.transitioningTo = null;
      isTransitioning.value = false;
    }, 500);
  });

  const nextTestimonial = $(() => {
    showTestimonial(testimonialsStore.currentIndex + 1, 'next');
  });

  const prevTestimonial = $(() => {
    showTestimonial(testimonialsStore.currentIndex - 1, 'prev');
  });

  const currentTestimonial = testimonialsStore.testimonials[testimonialsStore.currentIndex];

  return (
    <section
      id="testimonials"
      ref={testimonialsSectionRef}
      class={[styles.testimonials_section]}
    >
      <div ref={bgBranchRef}>
        <BgBranch alt="background branch image" class={[styles.bg_branch]} />
      </div>

      <div class={styles.main_content_testimonials}>
        <div
          ref={titleRef}
          class={[styles.title_container, { [styles.visible]: titleVisible.value }]}
        >
          <h2>What Our Guests Say</h2>
          <p>Real experiences from valued visitors.</p>
        </div>

        <div
          ref={carouselContainerRef}
          class={[styles.carousel_container, { [styles.visible]: carouselVisible.value }]}
          style={{ height: carouselHeight.value }}
        >
          {testimonialsStore.testimonials.length > 0 && currentTestimonial ? (
            <>
              <div
                key={currentTestimonial.id}
                class={[
                  styles.testimonial_card,
                  testimonialsStore.transitioningTo
                    ? testimonialsStore.transitioningTo.direction === 'next'
                      ? styles.slideOutLeft
                      : styles.slideOutRight
                    : isInitialMount.value && testimonialsStore.currentIndex === 0 && testimonialsStore.direction === 'none'
                    ? styles.slideInInitial
                    : testimonialsStore.direction === 'next'
                    ? styles.slideInRight
                    : testimonialsStore.direction === 'prev'
                    ? styles.slideInLeft
                    : styles.slideInRight,
                ]}
                style={{ backgroundImage: `url(${ImgQuote})` }}
              >
                <div class={styles.testimonial_header}>
                  {currentTestimonial.avatarUrl ? (
                    <img
                      src={currentTestimonial.avatarUrl}
                      alt={`${currentTestimonial.author}'s avatar`}
                      class={styles.avatar}
                      width="80"
                      height="80"
                      onError$={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/cccccc/FFFFFF?text=?'}
                    />
                  ) : (
                    <div class={[styles.avatar, styles.avatar_initials]}>
                      {currentTestimonial.author.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div class={styles.author_info}>
                    <h3>{currentTestimonial.author}</h3>
                    <div class={styles.rating}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} class={styles.star_wrapper}>
                          <IoStarSolid
                            width={20}
                            height={20}
                            style={{ width: '20px', height: '20px' }}
                            class={[
                              styles.star_icon,
                              i < Math.floor(currentTestimonial.rating) ? styles.filled_star : (i < currentTestimonial.rating ? styles.half_filled_star : styles.empty_star)
                            ]}
                          />
                        </div>
                      ))}
                      <span>({currentTestimonial.rating.toFixed(1)})</span>
                    </div>
                  </div>
                </div>
                <blockquote class={styles.testimonial_text}>
                  <p>"{currentTestimonial.text}"</p>
                </blockquote>
                <div class={styles.testimonial_footer}>
                  <span>{currentTestimonial.date}</span>
                  <span>•</span>
                  <span>{currentTestimonial.source}</span>
                </div>
              </div>

              {testimonialsStore.transitioningTo && (
                <div
                  key={testimonialsStore.testimonials[testimonialsStore.transitioningTo.index].id}
                  class={[
                    styles.testimonial_card,
                    testimonialsStore.transitioningTo.direction === 'next' ? styles.slideInRight : styles.slideInLeft,
                  ]}
                  style={{ backgroundImage: `url(${ImgQuote})` }}
                >
                  <div class={styles.testimonial_header}>
                    {testimonialsStore.testimonials[testimonialsStore.transitioningTo.index].avatarUrl ? (
                      <img
                        src={testimonialsStore.testimonials[testimonialsStore.transitioningTo.index].avatarUrl}
                        alt={`${testimonialsStore.testimonials[testimonialsStore.transitioningTo.index].author}'s avatar`}
                        class={styles.avatar}
                        width="80"
                        height="80"
                        onError$={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/cccccc/FFFFFF?text=?'}
                      />
                    ) : (
                      <div class={[styles.avatar, styles.avatar_initials]}>
                        {testimonialsStore.testimonials[testimonialsStore.transitioningTo.index].author
                          .split(" ")
                          .map(n => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                    <div class={styles.author_info}>
                      <h3>{testimonialsStore.testimonials[testimonialsStore.transitioningTo.index].author}</h3>
                      <div class={styles.rating}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} class={styles.star_wrapper}>
                            <IoStarSolid
                              width={20}
                              height={20}
                              style={{ width: '20px', height: '20px' }}
                              class={[
                                styles.star_icon,
                                i < Math.floor(testimonialsStore.testimonials[testimonialsStore.transitioningTo!.index].rating)
                                  ? styles.filled_star
                                  : i < testimonialsStore.testimonials[testimonialsStore.transitioningTo!.index].rating
                                  ? styles.half_filled_star
                                  : styles.empty_star
                              ]}
                            />
                          </div>
                        ))}
                        <span>({testimonialsStore.testimonials[testimonialsStore.transitioningTo.index].rating.toFixed(1)})</span>
                      </div>
                    </div>
                  </div>
                  <blockquote class={styles.testimonial_text}>
                    <p>"{testimonialsStore.testimonials[testimonialsStore.transitioningTo.index].text}"</p>
                  </blockquote>
                  <div class={styles.testimonial_footer}>
                    <span>{testimonialsStore.testimonials[testimonialsStore.transitioningTo.index].date}</span>
                    <span>•</span>
                    <span>{testimonialsStore.testimonials[testimonialsStore.transitioningTo.index].source}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p class={styles.no_testimonials}>No testimonials yet. Be the first to share your experience!</p>
          )}
        </div>

        {testimonialsStore.testimonials.length > 1 && (
          <div class={styles.carousel_navigation}>
            <button
              onClick$={prevTestimonial}
              aria-label="Previous testimonial"
              class={styles.nav_button}
              disabled={isTransitioning.value}
            >
              <IoChevronBackOutline />
            </button>
            <button
              onClick$={nextTestimonial}
              aria-label="Next testimonial"
              class={styles.nav_button}
              disabled={isTransitioning.value}
            >
              <IoChevronForwardOutline />
            </button>
          </div>
        )}
      </div>
    </section>
  );
});