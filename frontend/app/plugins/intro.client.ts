import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);
// Not every page has a title, header or footer to animate; empty target lists are expected.
gsap.config({ nullTargetWarn: false });

// Intro title (line by line) and page content fade in on every page. On the initial load the
// header, footer and metabar join in; until then html[data-intro="true"] keeps everything
// hidden (see main.scss).
export default defineNuxtPlugin((nuxtApp) => {
  const introPending = useState("intro-pending", () => true);
  const reveal = () => {
    introPending.value = false;
    // Set right away rather than on the next head update, so nothing flashes hidden again.
    document.documentElement.dataset.intro = "false";
  };
  const reducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let initialDone = false;
  let current: { timeline: gsap.core.Timeline; finish: () => void } | null =
    null;

  function animatePage(initial: boolean) {
    // A navigation mid-animation: settle the old page before animating the new one.
    current?.timeline.kill();
    current?.finish();

    const titles = gsap.utils.toArray<HTMLElement>(".page .intro h1");
    const introBlocks = gsap.utils
      .toArray<HTMLElement>(".page > *")
      .filter((el) => el.matches(".intro") || el.querySelector(".intro"));
    const introRest = gsap.utils
      .toArray<HTMLElement>(".page .intro .col > *")
      .filter((el) => !titles.includes(el));
    const header = initial
      ? gsap.utils.toArray<HTMLElement>(".header-section .col")
      : [];
    const content = [
      ...gsap.utils
        .toArray<HTMLElement>(".page > *")
        .filter((el) => !introBlocks.includes(el)),
      ...(initial
        ? gsap.utils.toArray<HTMLElement>(".footer-section, .metabar")
        : []),
    ];

    const split = SplitText.create(titles, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
    });

    gsap.set(header, { opacity: 0 });
    // No rise when jumping to an anchor, so the hash scroll lands on the final position.
    const rise = nuxtApp.$router.currentRoute.value.hash ? 0 : 24;
    gsap.set([...introRest, ...content], { opacity: 0, y: rise });
    // Past 100% so nothing peeks through the mask's descender padding.
    gsap.set(split.lines, { yPercent: 130 });
    gsap.set(introBlocks, { opacity: 1 });
    if (initial) reveal();

    const finish = () => {
      // Back to plain text so the title rewraps naturally on resize.
      split.revert();
      gsap.set([...header, ...introRest, ...content, ...introBlocks], {
        clearProps: "opacity,transform",
      });
      current = null;
    };

    // Page switches start a little later, while the page dimmer fades out.
    const offset = initial ? 0 : 0.1;
    const timeline = gsap
      .timeline({ defaults: { ease: "power3.out" }, onComplete: finish })
      .to(header, { opacity: 1, duration: 0.8, stagger: 0.08 }, 0)
      .to(
        split.lines,
        { yPercent: 0, duration: 1.1, stagger: 0.1, ease: "power4.out" },
        offset + 0.15,
      )
      .to(
        [...introRest, ...content],
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 },
        offset + 0.5,
      );

    current = { timeline, finish };
  }

  nuxtApp.hooks.hookOnce("app:suspense:resolve", async () => {
    if (reducedMotion()) {
      reveal();
      initialDone = true;
      return;
    }

    // Line breaks depend on the webfont, so split only once it's ready.
    await document.fonts.ready;
    animatePage(true);
    initialDone = true;
  });

  // Fires once the new page is rendered after a client-side navigation.
  nuxtApp.hook("page:finish", () => {
    if (!initialDone || reducedMotion()) return;
    animatePage(false);
  });
});
