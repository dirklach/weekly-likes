import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Reveals an element's text line by line (same motion as the page titles in intro.client.ts)
// once it scrolls into the viewport.
export function useSplitReveal(target: Ref<HTMLElement | null>) {
  let split: SplitText | null = null;
  let tween: gsap.core.Tween | null = null;
  let unmounted = false;

  onMounted(async () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);

    // Line breaks depend on the webfont, so split only once it's ready.
    await document.fonts.ready;
    const el = target.value;
    if (!el || unmounted) return;

    split = SplitText.create(el, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
    });

    tween = gsap.fromTo(
      split.lines,
      // Past 100% so nothing peeks through the mask's descender padding.
      { yPercent: 130 },
      {
        yPercent: 0,
        duration: 1.1,
        stagger: 0.1,
        ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
        // Back to plain text so it rewraps naturally on resize.
        onComplete: () => {
          split?.revert();
          split = null;
        },
      },
    );
  });

  onUnmounted(() => {
    unmounted = true;
    tween?.scrollTrigger?.kill();
    tween?.kill();
    split?.revert();
  });
}
