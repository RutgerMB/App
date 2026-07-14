# RepLock Gymbro TikTok — Post-Ready Pack

Ready-to-post slideshows for Slideshow 1 (Leg Day) and Slideshow 2 (Rest Timer).  
**Export slides from:** `docs/marketing/slides/`

---

## Posting order

| Day | Slideshow | Folder | Sound |
|-----|-----------|--------|-------|
| Day 1 | Leg Day Excuses | `slideshow-1/` | Trending phonk edit or METAMORPHOSIS-style gym montage |
| Day 2 | Rest Timer Scrolling | `slideshow-2/` | Slowed + reverb motivational speech or trending gym edit |

Upload slides **in numeric order** (`slide-01.png` → `slide-07.png`).  
Post **1 slideshow/day** for 2 days pre-launch; repost top performer as Story.

---

## Slideshow 1: Leg Day Excuses

**Folder:** `docs/marketing/slides/slideshow-1/`  
**Files:** `slide-01.png` … `slide-07.png` (7 frames, 1080×1920)

### Caption (copy-paste)

```
bro my phone had to bully me into squats 💀 RepLock locks your apps until you actually move. 20 push-ups = scroll time. no cap this fixed my rest-day doomscroll. who else skips legs then wonders why they look like a traffic cone 🦵
```

### Hashtags

```
#legday #skiplegs #gymbro #pushupchallenge #screentime #appblocker #fitnessmotivation #gymmotivation
```

### Slide order

1. POV: it's leg day and your brain is negotiating
2. I'll hit legs tomorrow
3. My knees feel weird tho
4. Upper body is looking insane anyway
5. Opens TikTok for 'motivation'
6. 45 min later. Zero squats. Full scroll.
7. Search RepLock *(CTA)*

### Sound

Trending phonk edit or "METAMORPHOSIS" style gym montage audio.

---

## Slideshow 2: Rest Timer Scrolling

**Folder:** `docs/marketing/slides/slideshow-2/`  
**Files:** `slide-01.png` … `slide-07.png` (7 frames, 1080×1920)

### Caption (copy-paste)

```
the rest between sets used to be my most productive scroll time 😭 RepLock = apps locked until you earn minutes with real reps. push-ups, squats, planks. finally training AND not losing the whole workout to the algorithm.
```

### Hashtags

```
#gymtok #restday #screentime #digitaldetox #gymbro #fitness #productivity #pushups
```

### Slide order

1. 90 second rest timer. 90 minute scroll session.
2. Set timer. Put phone down.
3. Check one notification
4. Now you're on Reels
5. Timer went off 20 min ago
6. Bro next to you hit 4 sets. You hit 1.
7. Search RepLock *(CTA)*

### Sound

Slowed + reverb motivational speech clip or trending "gym edit" audio.

---

## TikTok upload checklist

- [ ] Select **Photo carousel** (not video)
- [ ] Upload all 7 slides in order from the correct `slideshow-N/` folder
- [ ] Paste caption + hashtags from above
- [ ] Add suggested sound before posting
- [ ] Pin comment: "Search RepLock on the App Store" (swap to link in bio after launch)

## Regenerate slides

```bash
npm run marketing:slides
```

Generates both slideshows to `docs/marketing/slides/`. To rebuild one slideshow only:

```bash
node scripts/generate-tiktok-slides.mjs 1
node scripts/generate-tiktok-slides.mjs 2
```
