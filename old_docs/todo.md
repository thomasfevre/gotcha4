Login Page: ✅ COMPLETED

- ✅ Update the login/landing page : keep it simple and clear but add a bit more explanation of what is the purpose of the website, as well as my linkedin link, being the author
- ✅ Handle properly the account login ith a dedicated button, because currentmy there is only the "get started" one, which may confuse users that already have an account.
- ✅ Update the login/landing page to be a proper modern website landing page, with a dedicated get started and another "already an account ? login" button, and make it overall like a real modern website landing page, plus add this gradient feature too for this first page only


Create Page:
- ✅ add a field for external links (such as X (twitter), or linkedin, etc...). This will need to update many things such as the database, the annoyance card structure and data fetchng worklows, as well as zod types, etc...

Search Page: ✅ COMPLETED

- ✅ if categories are selected in the filter, show the latest annoyance from these categories even if the search bar input is empty (handle also that when clear out button is clicked, clear the current annoyances showed too).


Feed page: ✅ COMPLETED

- ✅ properly handle the annoyance like workflow (and if i want to unlike as well after i liked previously)
- ✅ handle the long annoyances descriptions: if too long, don't show the full description but add a button to extend/shrink the description in the annoyance card
- ✅ allow users to click on the post author to see its profile with its bio, posts and post stats, etc..


Profile page: ✅ COMPLETED

- ✅ handle properly the account settings button in the profile page :
    - Updates pseudo if it does not exists in the db
    - add a profile picture
    - possibility to delete account also
- ✅ create an edit button if not exists and handle edit button for my own annoyances created
- ✅ Add a profile description/bio (need to update the database for that)

Styling: ✅ COMPLETED

- ✅ add a dark mode toggle button in the layout


Security: ✅ COMPLETED
- ✅ security check on every insert in database (annoyance fields, comments, profile pseudonym, etc…) Disable urls, and other common bad strings

backend: [To test]
- for the feed page post fetching, add a pseudo algorythm : 
    - make the default generated post by me with least weight (this way, along people come to the platform and post, the first default post will be less and less shown)
    - for the feed to be interesting, pick random post from the most liked one / recent one (to have quality post showed at first, with a bit of randomness, that will incentive users to check the app often) + more optimizations later.


