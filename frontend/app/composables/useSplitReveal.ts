import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

type SplitRevealOptions = {
  // "lines": line by line, same motion as the page titles in intro.client.ts.
  // "words": each word fades in and slides up out of its own mask.
  type?: "lines" | "words";
};

// Reveals an element's text once it scrolls into the viewport (or right away on load when it
// already is). SplitText labels the element with its full text and hides the split pieces from
// screen readers; reduced motion skips the animation and leaves the text as is.
export function useSplitReveal(
  target: Ref<HTMLElement | null>,
  { type = "lines" }: SplitRevealOptions = {},
) {
  let split: SplitText | null = null;
  let tween: gsap.core.Tween | null = null;
  let trigger: ScrollTrigger | null = null;
  let unmounted = false;

  onMounted(async () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const mountedAt = performance.now();

    // Line breaks depend on the webfont, so split only once it's ready.
    await document.fonts.ready;
    const el = target.value;
    if (!el || unmounted) return;

    split =
      type === "words"
        ? SplitText.create(el, {
            type: "words",
            mask: "words",
            wordsClass: "split-word",
          })
        : SplitText.create(el, {
            type: "lines",
            mask: "lines",
            linesClass: "split-line",
          });
    const targets = type === "words" ? split.words : split.lines;

    // Past 100% so nothing peeks through the mask's descender padding.
    tween = gsap.fromTo(
      targets,
      type === "words" ? { yPercent: 130, opacity: 0 } : { yPercent: 130 },
      {
        yPercent: 0,
        opacity: 1,
        ...(type === "words"
          ? { duration: 0.7, stagger: 0.04, ease: "power3.out" }
          : { duration: 1.1, stagger: 0.1, ease: "power4.out" }),
        paused: true,
        // Back to plain text so it rewraps naturally on resize.
        onComplete: () => {
          split?.revert();
          split = null;
        },
      },
    );

    trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => {
        // Already in view on load: wait for the page content fade in intro.client.ts to start.
        const delay = performance.now() - mountedAt < 400 ? 0.5 : 0;
        gsap.delayedCall(delay, () => tween?.play());
      },
    });
  });

  onUnmounted(() => {
    unmounted = true;
    trigger?.kill();
    tween?.kill();
    split?.revert();
  });
}
