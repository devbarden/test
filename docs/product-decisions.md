# Product decisions

Choices that are not in the mockups, and what the app does at the edges.

## Decisions

| Decision | Why |
| --- | --- |
| **While the model is silent, show the orb from the prototype.** Then the text appears paragraph by paragraph with a caret where the next word lands. | On the live API the first token takes about 4 s. An empty panel reads as broken. |
| **During streaming, Copy becomes Stop.** Stop appears only once text is flowing, not while the model is thinking. | Nobody needs half a letter copied. Stopping a letter that went the wrong way is useful. A Stop button under the waiting animation reads as "something is stuck" when there is nothing to keep yet. |
| **Free keeps five applications, the same as the goal.** | The product pushes the user to five letters; the sixth needs Pro. The plan card, the meter and the limit dialog read the number from the entitlements. |
| **Try Again overwrites the same letter.** | A new row per retry would inflate the goal counter. If the retry fails or is stopped, the previous letter stays. |
| **After the first save the URL changes** from `/app/applications/create` to `/app/applications/<id>`, with `replace`. | Reload opens the letter, not an empty form. Back does not return to a form that was already submitted. |
| **Delete asks for confirmation and offers Undo.** | The dialog stops an accidental click. Undo puts the card back in place when the mistake is noticed later. |
| **The empty state has no button of its own.** | The goal banner below already has "Create New", and so does the header. The empty state shows what will appear here: ghost cards. |
| **Leaving during a generation asks first.** | The request already cost a quota point, and a letter without `done` is not saved. |
| **The character counter shows the real length.** | In the mockup it stayed at 0/1200 with a filled field. Over the limit, the field and the counter turn red, the button disables, and the screen reader hears only that the limit was crossed. |
| **The endpoint is closed to anonymous use.** | The model is called with one shared token and one shared limit. `userId` is the key for rate limits, for rows in the database and for the browser snapshot, so two accounts in one browser never see each other's letters. |
| **The list pages with a Load more button, ten at a time.** While a page loads, two skeleton cards with the card's exact shape sit where the cards will land. | Scroll-driven loading fired at the wrong moments and moved the page under the reader. A button loads when asked, keeps the footer still, and the skeletons take the space the cards will fill, so nothing jumps when they arrive. |
| **The goal is five letters.** | The product goal from the brief. The header and the banner count toward it; the banner disappears when it is reached and the daily counter takes its place. |

## Edge cases

| Situation | Behaviour |
| --- | --- |
| stream breaks mid-letter | not saved, the reason is shown, the partial text stays on screen |
| 429 from upstream or from our own limit | message with the wait time from `Retry-After` |
| no network | its own message |
| letter generated but not saved (database failure) | the text stays with a request to copy it, the quota point is refunded |
| letter deleted in another tab | a clear "not found" page; deleting an already deleted letter is not an error |
| saved-letter cap reached | a dialog explaining the plan **before** the request, not an error after a generated letter |
| daily quota spent | the same dialog with the hours until reset |
| `localStorage` full or holding a broken snapshot | the snapshot is discarded, the list loads from the server |
| `localStorage` unavailable (private Safari, webview) | the app runs without a snapshot |
| Clerk session expires mid-session | redirect to sign-in, cache cleared |
| `prefers-reduced-motion` | one rule stops every animation and view transition |
| 320 px phone | the header keeps only the progress dots, the daily counter hides |

## Noticed in the mockups

- The form screen's header says 4/5 while the banner says 3 out of 5.
- The 5/5 mockup has an extra home button next to the logo. Treated as an artefact.
- The counter shows 0/1200 with a filled field (see above).
- The banner copy says "couple more" as in the mockup, although "a couple more" is grammatically correct.
