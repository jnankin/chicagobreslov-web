#!/usr/bin/env python3
"""
Fetches the latest weekly parsha video from the BRI YouTube channel
and updates the video embed and title on index.html.
"""

import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

import anthropic

CHANNEL_ID = "UCxxFaLTvcmAdocmuhhLgzzw"
RSS_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
INDEX_HTML = os.path.join(os.path.dirname(__file__), "..", "index.html")


def fetch_recent_videos(days=7):
    with urllib.request.urlopen(RSS_URL, timeout=15) as response:
        xml_data = response.read()

    root = ET.fromstring(xml_data)
    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "yt": "http://www.youtube.com/xml/schemas/2015",
    }

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    recent = []

    for entry in root.findall("atom:entry", ns):
        published_str = entry.find("atom:published", ns).text
        published = datetime.fromisoformat(published_str.replace("Z", "+00:00"))
        if published >= cutoff:
            video_id = entry.find("yt:videoId", ns).text
            title = entry.find("atom:title", ns).text
            recent.append({"id": video_id, "title": title, "published": published_str})

    return recent


def find_parsha_video(videos):
    client = anthropic.Anthropic()

    video_list = "\n".join(
        f"- ID: {v['id']}, Title: {v['title']}, Published: {v['published']}"
        for v in videos
    )

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=256,
        messages=[
            {
                "role": "user",
                "content": f"""From these recent YouTube videos from the Breslov Research Institute, identify the weekly parsha or holiday Torah video.

Videos:
{video_list}

Respond in this exact format (no other text):
VIDEO_ID: <youtube video id>
TITLE: <parsha or holiday name, e.g. "Parshas Bereishis" or "Shavuos 5786">

If no parsha/holiday video is found, respond:
VIDEO_ID: none
TITLE: none""",
            }
        ],
    )

    text = message.content[0].text.strip()
    video_id_match = re.search(r"VIDEO_ID:\s*(\S+)", text)
    title_match = re.search(r"TITLE:\s*(.+)", text)

    if not video_id_match or not title_match:
        return None, None

    video_id = video_id_match.group(1)
    title = title_match.group(1).strip()

    if video_id == "none":
        return None, None

    return video_id, title


def update_index_html(video_id, title):
    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        content = f.read()

    updated = re.sub(
        r"(https?://www\.youtube\.com/embed/)[^?]+(\?wmode=opaque)",
        rf"\g<1>{video_id}\2",
        content,
    )
    updated = re.sub(
        r'(<font color="#ffffff" size="7">)[^<]+(</font>)',
        rf"\g<1>{title}\2",
        updated,
    )

    if updated == content:
        return False

    with open(INDEX_HTML, "w", encoding="utf-8") as f:
        f.write(updated)

    return True


def main():
    videos = fetch_recent_videos(days=7)

    if not videos:
        print("No videos posted in the past 7 days — nothing to update.")
        sys.exit(0)

    print(f"Found {len(videos)} recent video(s):")
    for v in videos:
        print(f"  [{v['published'][:10]}] {v['title']} ({v['id']})")

    video_id, title = find_parsha_video(videos)

    if not video_id:
        print("Claude could not identify a parsha/holiday video — nothing to update.")
        sys.exit(0)

    print(f"\nIdentified: {title} → {video_id}")

    if update_index_html(video_id, title):
        print("index.html updated.")
    else:
        print("index.html already up to date.")


if __name__ == "__main__":
    main()
