Fetch the latest weekly parsha video from the BRI YouTube channel and update the parsha section in index.html.

## Steps

1. Fetch the RSS feed: `curl -s "https://www.youtube.com/feeds/videos.xml?channel_id=UCxxFaLTvcmAdocmuhhLgzzw"`

2. Parse the XML output to extract video IDs, titles, and published dates. Filter to only videos published in the past 7 days (today is available via the currentDate context).

3. From those recent videos, identify the weekly parsha or holiday Torah video — it will have a title like "Parshas Bereishis", "Parshat Nasso", "Shavuot with Reb...", etc. Pick the most recent one if there are multiple.

4. Format the title as a short parsha/holiday name (e.g. "Parshas Naso", "Shavuos 5786") — not the full YouTube title.

5. Update `index.html`:
   - Replace the YouTube embed URL: `https://www.youtube.com/embed/<old_id>?wmode=opaque` → use the new video ID
   - Replace the parsha title inside: `<font color="#ffffff" size="7">...</font>` (only the first occurrence, in the parsha section around line 48)

6. Report what changed (old vs new title and video ID), or say if nothing needed updating.
