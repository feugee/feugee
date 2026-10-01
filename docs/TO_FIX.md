# DONE

- in hero, the i want the word before rotating words, currently "into" can be edited in CMS.
- in selected works section, i want the heading "Selected Works" to be editable in CMS.
- in hero, change the "Scroll to Explore" to be a button with label and url editable in CMS. the button will be invert white (button background color white, button text black, blending difference)
- for the rotating words, make the transition animation to softblur crossfade instead of the current slide up and down animation. each word is 1.5 seconds, and the transition is 0.5 seconds.
- above the clients marquee, add a heading "Clients Ideas We've Visualized" editable in CMS. Make the style of the heading to be the same as the "Selected Works" heading.
- in platform field, add
  - Behance
  - Linkedin
  - Pinterest
  - Dribbble
  - Contra
- In contact cta, i want to add second button (Action label and url)
- Scroll Progress Bar in works and works detail, change the color to be gradient from color-primary-500 in the left to color-secondary-500 in the right. The gradient should be horizontal, not vertical.
- fix height for clients marquee
- Change the menu in navbar using hamburger menu icon instead of the word "Menu", and change close icon to "X" instead of the word "Close"
- for the navbar, when the user scroll and navbar passed hero section (outside the hero section):
  morph the navbar background to frosted glass and make the left, top, and right position to 24 px from the edge.
- add back button in works detail
- change favicon to new favicon
- for asset, when the asset still loads, it blank. Add a loading animation.
- fix navbar frosted state
- run `scripts/setup-google-analytics.sh` after deploying the integration to finish Google console setup
- hero text responsive adjustments for 1080p screens
- font size for selected works title (responsive 1080) and year item (48px)
- padding selected works change to 64px
- footer copyright section make center
- hover effect for contact us section (same with menu)
- page transition bug in works detail page
- in works page, adjust font weight for title and sector. remove the difference
- gradient blur on card looks miss 1px
- implement youtube embed asset
- remove scrollbar so there will be no snapping frame after page transition
- footer social hover color become primary
- back button in works detail is capitalized
- add back to top button in works page if work item list is long (same trigger as the filter)
- implement sidebar toggle for the navbar menu
- work card hover transition. the greyscale effect should have a smooth transition. the title and other text should also have a smooth transition.
- video and animation dont work on mac (site now ignores prefers-reduced-motion entirely, per ADR 0011)

# TODO

- implement navigation rail in selected works with new design
- add badge to work
