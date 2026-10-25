# LUMN portfolio design

The portfolio is an artwork-led experience for prospective clients and collaborators. Preserve LUMN's charcoal and sage identity while giving the work stronger scale and hierarchy.

- Ground #141716; panels #212623; foreground #f0eee5; secondary #adb5ac; separators #3b443d; accent #c7df91.
- Self-hosted Space Grotesk for headings and identity; Arial for body copy. Heading tracking -0.035em; line height 1.08. Body line height 1.6–1.9.
- Static panoramic Ruins hero, followed by The Empty Frame and Puppet Strings film showcases, angled category selectors, a continuous artwork gallery, artist information and project enquiries.
- Fluid side margins: clamp(20px, 3.5vw, 64px). The native multicolumn gallery uses three columns, two at 1200px and below, and one at 700px and below. Cards retain source image proportions with explicit intrinsic dimensions and inline aspect ratios, followed by separate captions. No portrait crops or fixed landscape boxes.
- Describe production contributions without claiming collaborators' work. Credits remain visible in project details. Full-resolution artwork stays available through the existing zoom viewer.
- No slideshow, autoplay media, or empty Props category. Do not reintroduce sample artwork into the live project list.
- Motion is optional: brief one-time section entrances and subtle pointer-only image feedback. Reduced-motion preference disables spatial animation. Content stays visible without animation support.

Preview images are compressed derivatives of the artist's uploaded files. Source originals are unchanged. Space Grotesk is distributed under the included SIL Open Font License.

## Portrait polish — 2026-10-25

Requested direction: DESIGN_VARIANCE=5, MOTION_INTENSITY=5, VISUAL_DENSITY=2. These are art-direction settings, implemented through varied artwork heights, restrained spring feedback, and spacious layout tokens.

- Gallery gap: clamp(24px, 3vw, 48px); section padding: clamp(56px, 6vw, 96px).
- Card hover: translateY(-4px) scale(1.008); press: scale(.99). A sampled mass=1, stiffness=100, damping=10 spring curve drives a 300ms CSS transition. Motion is limited to fine-pointer hover and disabled for reduced-motion preferences; keyboard navigation stays immediate.
- About portrait: optimized derivative of assets/profile/Profile.png, with full natural 3:4 framing and only a bottom fade. Original upload is retained.
- The existing on-demand model viewer retains native camera controls. No background canvas or WebGL layer has been added over interactive content.
- Tested desktop 1440px, tablet 768px, mobile 390px and 320px: natural ratios, no horizontal overflow or caption overlap, filters, detail dialog, and zoom. A delayed-image test measured zero gallery geometry movement after image loading.
- Recovery point: backup/before-portrait-polish-2026-10-25 at 76f328ff1f042f11737009b9463ce9c2618bf83f. Revert the polish commit to undo its changes without discarding later commits.

